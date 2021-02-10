---
title: 2. MyBatis-Plus 的使用
date: 2020-03-19 14:59:53
tags: Java
categories: blog
---

## 2. MyBatis-Plus 的使用
### 2.1 代码生成器
- 项目依赖：mybatis-plus-boot-starter、mysql-connector-java、mybatis-plus-generator、druid-spring-boot-starter、spring-boot-starter-freemarker
```xml
<dependencies>
    <!--SpringMVC-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!--mp、druid、mysql、mp-generator（MyBatis-Plus 从 3.0.3后移除了代码生成器与模板引擎的默认依赖）、MP支持的SQL分析器-->
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-boot-starter</artifactId>
        <version>3.2.0</version>
    </dependency>
<!--        <dependency>-->
<!--            <groupId>com.alibaba</groupId>-->
<!--            <artifactId>druid-spring-boot-starter</artifactId>-->
<!--            <version>1.1.10</version>-->
<!--        </dependency>-->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-generator</artifactId>
        <version>3.2.0</version>
    </dependency>
    <dependency>
        <groupId>p6spy</groupId>
        <artifactId>p6spy</artifactId>
        <version>3.8.6</version>
    </dependency>

    <!--Freemarker-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-freemarker</artifactId>
    </dependency>
</dependencies>
```

### 2.2 分页插件
- 配置类，SpringBoot 的使用方式
```java
@Configuration
@EnableTransactionManagement
@MapperScan("org.myslayers.mapper")
public class MyBatisPlusConfig {

    /**
     * 分页插件
     */
    @Bean
    public PaginationInterceptor paginationInterceptor() {
        PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
        return paginationInterceptor;
    }
}
```

### 2.3 执行 SQL 分析打印
- 该功能依赖 p6spy 组件，其中 datasource、freemarker、mybatis-plus 的配置如下：
```yaml
spring:
  datasource:
    #    driver-class-name: com.mysql.cj.jdbc.Driver
    driver-class-name: com.p6spy.engine.spy.P6SpyDriver
    url: jdbc:p6spy:mysql://127.0.0.1:3306/xblog?useUnicode=true&useSSL=false&characterEncoding=utf8&serverTimezone=UTC
    username: root
    password: 4023615
  freemarker:
    settings:
      classic_compatible: true
      datetime_format: yyyy-MM-dd HH:mm
      number_format: 0.##

mybatis-plus:
  mapper-locations: classpath*:/mapper/**Mapper.xml
```
- p6spy 组件对应的 spy.properties 配置如下：
```properties
#3.2.1以下使用或者不配置
module.log=com.p6spy.engine.logging.P6LogFactory,com.p6spy.engine.outage.P6OutageFactory
# 自定义日志打印
logMessageFormat=com.baomidou.mybatisplus.extension.p6spy.P6SpyLogger
#日志输出到控制台
appender=com.baomidou.mybatisplus.extension.p6spy.StdoutLogger
# 使用日志系统记录 sql
#appender=com.p6spy.engine.spy.appender.Slf4JLogger
# 设置 p6spy driver 代理
deregisterdrivers=true
# 取消JDBC URL前缀
useprefix=true
# 配置记录 Log 例外,可去掉的结果集有error,info,batch,debug,statement,commit,rollback,result,resultset.
excludecategories=info,debug,result,batch,resultset
# 日期格式
dateformat=yyyy-MM-dd HH:mm:ss
# 实际驱动可多个
#driverlist=org.h2.Driver
# 是否开启慢SQL记录
outagedetection=true
# 慢SQL记录标准 2 秒
outagedetectioninterval=2
```

### 2.4 条件构造器
- AbstractWrapper、QueryWrapper、UpdateWrapper
```java
@Service
public class PostServiceImpl extends ServiceImpl<PostMapper, Post> implements PostService {
    @Autowired
    PostMapper postMapper;

    @Override
    public IPage<PostVo> selectPosts(Page page, Long categoryId, Long userId, Integer level, Boolean recommend, String order) {
        if (level == null) level = -1;
        QueryWrapper wrapper = new QueryWrapper<Post>()
                .eq(categoryId != null, "category_id", categoryId)
                .eq(userId != null, "user_id", userId)
                .eq(level == 0, "level", 0)
                .gt(level > 0, "level", 0)
                .orderByDesc(order != null, order);
        return postMapper.selectPosts(page, wrapper);
    }

    @Override
    public PostVo selectOnePost(QueryWrapper<Post> warapper) {
        return postMapper.selectOnePost(warapper);
    }
}
```