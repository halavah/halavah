---
title: 7. 集成 Redis 实现访问量
date: 2020-03-19 14:59:53
tags: Java
categories: blog
---

## 7. 集成 Redis 实现访问量
### 7.1 数据一致性
- 文章阅读【缓存实现访问量】：减少访问数据库的次数，存在一个 BUG，只与点击链接的次数相关，没有与用户的 id 进行绑定
```java
@Controller
public class PostController extends BaseController {
    /**
     * 详情detail
     */
    @RequestMapping("/detail/{id:\\d*}")
    public String detail(@PathVariable(name = "id") long id) {
        /**
         * 一条（post实体类、PostVo实体类）
         */
        //一条：selectOnePost（表 文章id = 传 文章id），因为Mapper中select信息中，id过多引起歧义，故采用p.id
        PostVo postVo = postService.selectOnePost(new QueryWrapper<Post>().eq("p.id", id));
        //req：PostVo实体类 -> CategoryId属性
        req.setAttribute("currentCategoryId", postVo.getCategoryId());
        //req：PostVo实体类（回调）
        req.setAttribute("postVoData", postVo);

        /**
         * 评论（comment实体类）
         */
        //评论：page(分页信息、文章id、用户id、排序)
        IPage<CommentVo> results = commentService.selectComments(getPage(), postVo.getId(), null, "created");
        //req：CommentVo分页集合
        req.setAttribute("commentVoDatas", results);

        /**
         * 文章阅读【缓存实现访问量】：减少访问数据库的次数，存在一个BUG，只与点击链接的次数相关，没有与用户的id进行绑定
         */
        postService.putViewCount(postVo);

        return "post/detail";
    }
}
```
```java
@Service
public class PostServiceImpl extends ServiceImpl<PostMapper, Post> implements PostService {
    @Autowired
    RedisUtil redisUtil;
    
    /**
     * 文章阅读【缓存实现访问量】：减少访问数据库的次数，存在一个BUG，只与点击链接的次数相关，没有与用户的id进行绑定
     */
    @Override
    public void putViewCount(PostVo postVo) {
        //1.从缓存中获取当前访问量viewCount
        String hKey = "day:rank:post:" + postVo.getId();
        Integer viewCount = (Integer)redisUtil.hget(hKey, "post-viewCount");

        //2.若缓存中存在viewCount，则viewCount+1；若不存在，则postVo.getViewCount()+1
        //  注意一点，项目启动前会对【7天内的文章】进行缓存，因此，还会存在【7天前的文章】未进行缓存
        if (viewCount != null) {
            postVo.setViewCount(viewCount + 1);
        } else {
            postVo.setViewCount(postVo.getViewCount() + 1);
        }

        //3.将viewCount同步到缓存中
        redisUtil.hset(hKey, "post-viewCount", postVo.getViewCount());
    }
}
```

### 7.2 定时器定时更新
- 每分钟同步一次（缓存 -> 同步到数据库）
```java
@EnableScheduling//开启定时器
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("http://localhost:8080");
    }
}
```
```java
/**
 * 定时器定时更新
 */
@Component
public class ViewCountSyncTask {

    @Autowired
    RedisUtil redisUtil;

    @Autowired
    RedisTemplate redisTemplate;

    @Autowired
    PostService postService;

    //每分钟同步一次（缓存 -> 同步到数据库）
    @Scheduled(cron = "0/5 * * * * *")
    public void task() {
        //1.查询缓存中"day:rank:post:"的全部key
        Set<String> keys = redisTemplate.keys("day:rank:post:" + "*");

        //2.遍历全部key，如果某个key中含有“post-viewCount”，则通过ArrayList数组依次将【带有post-viewCount的文章postId】存放
        List<String> ids = new ArrayList<>();
        for (String key : keys) {
            if (redisUtil.hHasKey(key, "post-viewCount")) {
                String postId = key.substring("day:rank:post:".length());
                ids.add(postId);
            }
        }

        //3.将【全部缓存中的postId】同步到数据库
        if (ids.isEmpty()) {
            //3.1 如果[没有需要更新阅读量的文章】，则直接返回
            return;
        } else {
            //3.2 如果[存在需要更新阅读量的文章】，则先【根据ids查询全部的文章】，再【从缓存中获取该postId对应的访问量】，然后【给Post重新赋值viewCount】
            List<Post> posts = postService.list(new QueryWrapper<Post>().in("id", ids));
            for (Post post : posts) {
                Integer viewCount = (Integer) redisUtil.hget("day:rank:post:" + post.getId(), "post-viewCount");
                post.setViewCount(viewCount);
            }

            //3.3 同步操作
            if (posts.isEmpty()) {
                //如果【数据库中刚好删除完全部文章，即不存在文章】，则直接返回
                return;
            } else {
                //同步数据，并删除缓存
                if (postService.updateBatchById(posts)) {
                    for (String id : ids) {
                        redisUtil.hdel("day:rank:post:" + id, "post-viewCount");
                        System.out.println(id + "---------------------->同步成功");
                    }
                }
            }
        }
    }
}
```




