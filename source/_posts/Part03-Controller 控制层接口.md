---
title: 3. Controller 控制层接口
date: 2020-03-19 14:59:53
tags: Java
categories: blog
---

## 3. Controller 控制层接口
### 3.1 `indexController` 数据接口
- 渲染分类：首页 `index` -> 分类（`传入 id`） -> 渲染分类 -> `currentCategoryId`
- 接口数据：首页 `index` -> 多条（`post 实体类、PostVo 实体类`） -> `postVoDatas`
```java
@Controller
public class IndexController extends BaseController {

    /**
     * 首页index
     */
    @RequestMapping({"", "/", "/index","/index.html"})
    public String index() {
        /**
         * 多条（post实体类、PostVo实体类）：分页集合results
         */
        //多条：selectPosts(分页信息、分类id、用户id、置顶、精选、排序)
        IPage<PostVo> results = postService.selectPosts(getPage(), null, null, null, null, "created");
        req.setAttribute("postVoDatas", results);

        /**
         * 分类（传入id） -> 渲染分类
         */
        //req：根据传入category表中当前页的id -> 【渲染】分类
        req.setAttribute("currentCategoryId", 0);

        return "index";
    }
}
```

### 3.2 `PostController` 数据接口
- 渲染分类：分类 `category` -> 分类（`传入 id`）-> 渲染分类 -> `currentCategoryId`
- 解决数据：分类 `category` -> `<@details categoryId=currentCategoryId pn=pn size=2>`无法传入参数 `pn` 的方法：`让 pn 直接从 req 请求中获取 -> 作为传入 posts 方法的参数`
- 接口数据：详情 `detail` -> 一条（`post 实体类、PostVo 实体类`） -> `postVoData`
- 接口数据：详情 `detail` -> 评论（`comment 实体类`） -> `commentVoDatas`
```java
@Controller
public class PostController extends BaseController {

    /**
     * 分类category
     */
    @RequestMapping("/category/{id:\\d*}")
    public String category(@PathVariable(name = "id") long id) {
        /**
         * 分类（传入id）-> 渲染分类
         */
        //req：根据传入category表中当前页的id -> 【渲染】分类
        req.setAttribute("currentCategoryId", id);

        //req：解决使用<@details categoryId=currentCategoryId pn=pn size=2>时，无法传入参数pn的方法：让pn直接从req请求中获取 -> 作为传入posts方法的参数
        req.setAttribute("pn", ServletRequestUtils.getIntParameter(req, "pn", 1));

        return "post/category";
    }

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
- 配置类：项目启动时，会同时调用该 `run` 方法：提前加载导航栏中的“提问、分享、讨论、建议”，并将其 `list` 放入 `servletContext` 上下文对象：
```java
@Component
public class ContextStartup implements ApplicationRunner, ServletContextAware {

    @Autowired
    CategoryService categoryService;

    ServletContext servletContext;

    /**
     * 项目启动时，会同时调用该run方法：提前加载导航栏中的“提问、分享、讨论、建议”，并将其list放入servletContext上下文对象
     */
    @Override
    public void run(ApplicationArguments args) throws Exception {
        List<Category> categories = categoryService.list(new QueryWrapper<Category>()
                .eq("status", 0)
        );
        servletContext.setAttribute("categorys", categories);
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