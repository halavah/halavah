---
title: 4. 自定义 Freemaker 标签
date: 2020-03-19 14:59:53
tags: Java
categories: blog
---

## 4. 自定义 Freemaker 标签
### 4.1 方式一：实现 `TemplateDirectiveModel` 接口，重写 `excute` 方法
```java
public interface TemplateDirectiveModel extends TemplateModel {
  public void execute(Environment env, Map params, TemplateModel[] loopVars, TemplateDirectiveBody body) throws TemplateException, IOException;
}
```
上述方法的参数说明：
- env：系统环境变量，通常用它来输出相关内容，如 Writer out = env.getOut()
- params：自定义标签传过来的对象，其 key = 自定义标签的参数名，value 值是 TemplateModel 类型，而 TemplateModel 是一个接口类型，通常我们都使用 TemplateScalarModel 接口来替代它获取一个 String 值，如 TemplateScalarModel.getAsString(); 当然还有其它常用的替代接口，如 TemplateNumberModel 获取 number，TemplateHashModel 等。
- loopVars 循环替代变量
- body 用于处理自定义标签中的内容，如 <@myDirective> 将要被处理的内容；当标签是<@myDirective /> 格式时，body=null

### 4.2 方式二：采用 `mblog` 项目对该 `TemplateDirectiveModel` 接口进行封装
- 实现 `TemplateDirectiveModel` 接口较为复杂，故我们可以直接使用 `mblog` 项目中已经封装好的类：`org.myslayers.common.templates.DirectiveHandler`、`TemplateDirective`、`TemplateModelUtils`；
- 其中，我们只需要重写 `TemplateDirective` 类中的 `getName`（）和 `excute（DirectiveHandler handler）`，本次使用 `PostsTemplate`、`TimeAgoMethod` 进行开发使用；
- 最后，使用 `FreemarkerConfig` 类在 `Springboot` 中对 `PostsTemplate`、`TimeAgoMethod` 进行标签的声明`<timeAgo></timeAgo>`、`<details></details>`。
```java
public class DirectiveHandler {
    
}
public abstract class TemplateDirective implements TemplateDirectiveModel {
    
}
public class TemplateModelUtils {
    
}
```
```java
public class TimeAgoMethod extends DirectiveHandler.BaseMethod {
    
}
public class PostsTemplate extends TemplateDirective {
    
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
     */
    @PostConstruct
    public void setUp() {
        configuration.setSharedVariable("timeAgo", timeAgoMethod);
        configuration.setSharedVariable("details", postsTemplate);
    }
}
```