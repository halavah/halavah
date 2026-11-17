---
title: 6. 集成 Redis 实现本周热议
date: 2020-03-19 14:59:53
tags: Java
categories: blog
---

## 6. 集成 Redis 实现本周热议
### 6.1 环境搭建
- 添加 redis 依赖，使用 utils 包下的 RedisUtil 对内置 RedisTemplate 进行封装
- 添加 hutool 依赖，使用 DateUtil 类中的 offsetDay()、format()
- 考虑到 redis 序列化后出现乱码问题，使用 RedisConfig 配置类进行编码的处理
```xml
<dependencies>
    <!--Redis-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>

    <!--hutool：工具包，例如DateUtils工具类...-->
    <dependency>
        <groupId>cn.hutool</groupId>
        <artifactId>hutool-all</artifactId>
        <version>4.1.17</version>
    </dependency>
</dependencies>
```
```java
/**
 * 指定Redis的序列化后的格式
 */
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate redisTemplate(RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<Object, Object> template = new RedisTemplate();
        template.setConnectionFactory(redisConnectionFactory);

        Jackson2JsonRedisSerializer jackson2JsonRedisSerializer = new Jackson2JsonRedisSerializer(Object.class);
        jackson2JsonRedisSerializer.setObjectMapper(new ObjectMapper());

        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jackson2JsonRedisSerializer);

        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(jackson2JsonRedisSerializer);

        return template;
    }

}
```

### 6.2 本周热议的【基本原理】：利用 Redis 的 zet 有序集合实现
- 缓存热评文章——哈希表 Hash
- 评论数量排行——有序列表 sortedSet：ZADD（添加）、ZREVRANGE（展示）、ZUNIONSTORE（并集）
    - ZADD key score member [[score member] [score member] ...]     
        ```
        127.0.0.1:6379> ZADD day:18 10 post:1 6 post:2 4 post:3
        (integer) 3
        127.0.0.1:6379> ZADD day:19 10 post:1 6 post:2 4 post:3
        (integer) 3
        127.0.0.1:6379> ZADD day:20 10 post:1 6 post:2 4 post:3
        (integer) 3
        127.0.0.1:6379> ZADD day:21 10 post:1 6 post:2 4 post:3
        (integer) 3
        127.0.0.1:6379> ZADD day:22 10 post:1 6 post:2 4 post:3
        (integer) 3
        127.0.0.1:6379> ZADD day:23 10 post:1 6 post:2 4 post:3
        (integer) 3
        127.0.0.1:6379> ZADD day:24 10 post:1 6 post:2 4 post:3
        (integer) 3
        ```
    - ZREVRANGE key start stop [WITHSCORES]
        ```
        127.0.0.1:6379> ZREVRANGE day:18 0 -1 withscores
        1) "post:1"
        2) "10"
        3) "post:2"
        4) "6"
        5) "post:3"
        6) "4"
        ```
    - ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
        ```
        127.0.0.1:6379> ZUNIONSTORE week:rank 7 day:18 day:19 day:20 day:21 day:22 day:23 day:24
        1) "post:1"
        2) "post:2"
        ```
    - 查看排行榜
        ```
        127.0.0.1:6379> ZREVRANGE week:rank 0 -1 withscores
        1) "post:1"
        2) "70"
        3) "post:2"
        4) "42"
        5) "post:3"
        6) "28"
        ```
    - 添加/删除评论
        ```
        127.0.0.1:6379> ZINCRBY day:18 10 post:1
        "20"
        127.0.0.1:6379> ZREVRANGE  day:18 0 -1 withscores
        1) "post:1"
        2) "20"
        3) "post:2"
        4) "6"
        5) "post:3"
        6) "4"
        127.0.0.1:6379> ZINCRBY day:18 -10 post:1
        "10"
        ```
        
### 6.3 本周热议的【初始化操作】
- 项目启动前，获取【近 7 天文章】
- 初始化【近 7 天文章】的总评论量（先使用 SortedSet 集合对【排行榜 7 天内全部文章】进行 zadd 操作，并设置它们 expire 为 7 天；再使用 Hash 哈希表对【排行榜 7 天内全部文章】进行 hexists 判断，再 hset 缓存操作）
    - 添加 add——将【近 7 天文章】创建日期时间作为 key 值，每篇文章对应的 id 作为它的 value 值，每篇文章对应的评论 comment 作为它的 score 值，并使用 redis 的工具类（RedisUtil），对文章的具体属性进行 zSet()缓存操作
    - 过期 expire——让【近 7 天文章】的 key 过期： 7-（当前时间-创建时间）= 过期时间
    - 缓存——缓存【近 7 天文章】的一些基本信息，例如文章 id，标题 title，评论数量，作者信息...方便访问【近 7 天文章】时，直接 redis，而非 MySQL
        - 先对文章进行 EXISTS 判断其缓存是否存在
        - 如果 false 不存在，则再 hset 缓存操作
- 对【近 7 天文章】做并集运算（zUnionAndStore）， 并使用根据评论量的数量从大到小进行展示（zrevrange）
```java
/**
 * Context配置类
 */
@Component
public class ContextStartup implements ApplicationRunner, ServletContextAware {

    @Autowired
    CategoryService categoryService;

    ServletContext servletContext;

    @Autowired
    PostService postService;

    /**
     * 项目启动时，会同时调用该run方法：
     *
     * 加载导航栏中的“提问、分享、讨论、建议”，并将其list放入servletContext上下文对象
     * 加载本周热议
     */
    @Override
    public void run(ApplicationArguments args) throws Exception {
        List<Category> categories = categoryService.list(new QueryWrapper<Category>()
                .eq("status", 0)
        );
        servletContext.setAttribute("categorys", categories);

        postService.initWeekRank();
    }

    /**
     * servletContext上下文对象
     */
    @Override
    public void setServletContext(ServletContext servletContext) {
        this.servletContext = servletContext;
    }
}
```
```java
@Service
public class PostServiceImpl extends ServiceImpl<PostMapper, Post> implements PostService {

    @Autowired
    RedisUtil redisUtil;

    /**
     * 项目启动前，初始化本周热议（近7天全部文章评论量的排行榜）
     */
    @Override
    public void initWeekRank() {
        //1.获取【近7天文章】
        List<Post> posts = this.list(new QueryWrapper<Post>()
                .gt("created", DateUtil.offsetDay(new Date(), -6))  //根据created时间，对最近7天内的文章进行筛选
                .select("id, title, user_id, comment_count, view_count, created") //对文章的属性进行筛选，加快查询速率
        );

        //2.初始化【近7天文章】的总评论量（先使用SortedSet集合对【排行榜7天内全部文章】进行zadd操作，并设置它们expire为7天；再使用Hash哈希表对【排行榜7天内全部文章】进行hexists判断，再hset缓存操作）
        for (Post post : posts) {
            //1.添加add——|day:rank:20210202--0208|，将【近7天文章】创建日期时间作为key值，每篇文章对应的id作为它的value值，每篇文章对应的评论comment作为它的score值，并使用redis的工具类（RedisUtil），对文章的具体属性进行zSet()缓存操作
            String zKey = "day:rank:" + DateUtil.format(post.getCreated(), DatePattern.PURE_DATE_FORMAT);
            redisUtil.zSet(zKey, post.getId(), post.getCommentCount());//阅读redisUtil工具类，可知zSet等同于zadd

            //2.过期expire——|day:rank:20210202--0208|，让【近7天文章】的key过期： 7-（当前时间-创建时间）= 过期时间
            long expireTime = (7 - DateUtil.between(new Date(), post.getCreated(), DateUnit.DAY)) * 24 * 60 * 60;
            redisUtil.expire(zKey, expireTime);

            //3.缓存——|day:rank:post:1~16|，缓存【近7天文章】的一些基本信息，例如文章id，标题title，评论数量，作者信息...方便访问【近7天文章】时，直接redis，而非MySQL
            //3.1先对文章进行EXISTS判断其缓存是否存在
            String hKey = "day:rank:post:" + post.getId();
            if (!redisUtil.hasKey(hKey)) {
                //3.2如果false不存在，则再hset缓存操作
                redisUtil.hset(hKey, "post-id", post.getId(), expireTime);
                redisUtil.hset(hKey, "post-title", post.getTitle(), expireTime);
                redisUtil.hset(hKey, "post-commentCount", post.getCommentCount(), expireTime);
                redisUtil.hset(hKey, "post-viewCount", post.getViewCount(), expireTime);
            }
        }

        //3.对【近7天文章】做并集运算（zUnionAndStore）， 并使用根据评论量的数量从大到小进行展示（zrevrange）
        String currentKey = "day:rank:" + DateUtil.format(new Date(), DatePattern.PURE_DATE_FORMAT);
        List<String> otherKeys = new ArrayList<>();
        for (int i = -6; i < 0; i++) {
            String temp = "day:rank:" + DateUtil.format(DateUtil.offsetDay(new Date(), i), DatePattern.PURE_DATE_FORMAT);
            otherKeys.add(temp);
        }
        String destKey = "week:rank";
        redisUtil.zUnionAndStore(currentKey, otherKeys, destKey);
    }
}
```

### 6.4 本周热议的【初始化操作】：自定义标签【hots】
```java
/**
 * 本周热议
 */
@Component
public class HotsTemplate extends TemplateDirective {

    @Autowired
    RedisUtil redisUtil;

    @Override
    public String getName() {
        return "hots";
    }

    @Override
    public void execute(DirectiveHandler handler) throws Exception {
        List<Map> hostPost = new ArrayList<>();

        // 获取有序集 key 中成员 member 的排名，其中有序集成员按 score 值递减 (从大到小) 排序
        Set<ZSetOperations.TypedTuple> typedTuples = redisUtil.getZSetRank("week:rank", 0, 6);
        for (ZSetOperations.TypedTuple typedTuple : typedTuples) {
            Map<String, Object> map = new HashMap<>();

            //zSet(key， value， score)  -> zSet(文章日期, 文章id, 文章评论数commentCount)，此处取出zSet中的value，即文章id
            String postHashKey = "day:rank:post:" + typedTuple.getValue();

            map.put("id", redisUtil.hget(postHashKey, "post-id"));
            map.put("title", redisUtil.hget(postHashKey, "post-title"));
            map.put("commentCount", redisUtil.hget(postHashKey, "post-commentCount"));
            map.put("viewCount", redisUtil.hget(postHashKey, "post-viewCount"));

            hostPost.add(map);
        }

        handler.put(RESULTS, hostPost).render();
    }
}
```
```java
/**
 * Freemarker配置类
 */
@Configuration
public class FreemarkerConfig {

    @Autowired
    private freemarker.template.Configuration configuration;

    @Autowired
    TimeAgoMethod timeAgoMethod;

    @Autowired
    PostsTemplate postsTemplate;

    @Autowired
    HotsTemplate hotsTemplate;

    /**
     * 注册为“timeAgo”函数：快速实现日期转换
     * 注册为“posts”函数：快速实现分页
     * 注册为"hots"函数：快速实现本周热议
     */
    @PostConstruct
    public void setUp() {
        configuration.setSharedVariable("timeAgo", timeAgoMethod);
        configuration.setSharedVariable("details", postsTemplate);
        configuration.setSharedVariable("hots", hotsTemplate);
    }
}
```

### 6.4 本周热议的【更新操作】
- 自增/自减评论数
- 更新这篇文章的缓存时间，并更新这篇文章的基本信息
- 对【近 7 天文章】重新做并集运算（zUnionAndStore）， 并使用根据评论量的数量从大到小进行展示（zrevrange）
```java
@Service
public class PostServiceImpl extends ServiceImpl<PostMapper, Post> implements PostService {

    @Autowired
    RedisUtil redisUtil;

    /**
     * 本周热议：增加评论后，通过自增/自减评论数、再对排行榜做并集运算
     */
    @Override
    public void incrCommentCountAndUnionForWeekRank(Post post, boolean isIncr) {
        //1.自增/自减评论数
        String currentKey = "day:rank:" + DateUtil.format(new Date(), DatePattern.PURE_DATE_FORMAT);
        redisUtil.zIncrementScore(currentKey, post.getId(), isIncr ? 1 : -1);

        //2.更新这篇文章的缓存时间，并更新这篇文章的基本信息
        String zKey = "day:rank:" + DateUtil.format(post.getCreated(), DatePattern.PURE_DATE_FORMAT);
        long expireTime = (7 - DateUtil.between(new Date(), post.getCreated(), DateUnit.DAY)) * 24 * 60 * 60;
        redisUtil.expire(zKey, expireTime);
        String hKey = "day:rank:post:" + post.getId();
        if (!redisUtil.hasKey(hKey)) {
            //3.2如果false不存在，则再hset缓存操作
            redisUtil.hset(hKey, "post-id", post.getId(), expireTime);
            redisUtil.hset(hKey, "post-title", post.getTitle(), expireTime);
            redisUtil.hset(hKey, "post-commentCount", post.getCommentCount(), expireTime);
            redisUtil.hset(hKey, "post-viewCount", post.getViewCount(), expireTime);
        }

        //3.对【近7天文章】重新做并集运算（zUnionAndStore）
        List<String> otherKeys = new ArrayList<>();
        for (int i = -6; i < 0; i++) {
            String temp = "day:rank:" + DateUtil.format(DateUtil.offsetDay(new Date(), i), DatePattern.PURE_DATE_FORMAT);
            otherKeys.add(temp);
        }
        String destKey = "week:rank";
        redisUtil.zUnionAndStore(currentKey, otherKeys, destKey);
    }
}
```