---
title: 微积分（甲）II 复习笔记
date: 2026-06-25
tags:
  - 课程/复习
  - 课程/微积分
aliases:
  - 微积分甲II复习
---

# 微积分（甲）II 复习笔记

资料依据：`微积分复习.pdf`、`微积分（甲）II 零基础精讲.pdf`、`期末考试高频考点与备考策略.pdf`、`期末考试真题全解析.pdf`、`期末真题演练本.pdf`。扫描版章节 PDF 没有文字层，本笔记用可读讲义覆盖同一板块。

## 全册地图

| 模块 | 必会内容 | 常见考法 |
|---|---|---|
| 一元工具 | Taylor、等价无穷小、求导、积分技巧 | 为多元、级数、证明题服务 |
| 空间解析几何 | 平面、直线、曲面、切平面、法线 | 求方程、距离、投影、切线 |
| 多元微分 | 偏导、可微、梯度、链式、隐函数、极值 | 判定、计算、条件极值 |
| 重积分 | 二重/三重积分、换序、坐标变换 | 选坐标、定区域、算积分 |
| 曲线积分 | 第一类、第二类、Green、保守场 | 方向、奇点、补边 |
| 曲面积分 | 第一类、第二类、Gauss、Stokes | 法向、补面、闭合化 |
| 级数 | 数项、幂级数、Taylor、Fourier | 判敛、收敛域、展开求和 |
| 证明题 | 中值定理、最值法、积分公式 | 构造函数、凑散度/旋度 |

> [!tip] 复习原则
> 微积分下册不是背公式，而是“识别对象”：区域像圆就极坐标，空间旋转体就柱/球坐标，边界闭合就想 Green/Gauss/Stokes，级数先判类型再选判别法。

## 0. 一元工具速通

### 0.1 常用 Taylor 和等价无穷小

必须熟到能直接替换：

$$
e^x=1+x+\frac{x^2}{2!}+\cdots
$$

$$
\sin x=x-\frac{x^3}{3!}+\frac{x^5}{5!}-\cdots
$$

$$
\cos x=1-\frac{x^2}{2!}+\frac{x^4}{4!}-\cdots
$$

$$
\ln(1+x)=x-\frac{x^2}{2}+\frac{x^3}{3}-\cdots
$$

$$
\frac{1}{1-x}=1+x+x^2+\cdots,\quad |x|<1
$$

常用等价：

- $1-\cos x\sim \frac12x^2$。
- $\sin x\sim x$。
- $\tan x\sim x$。
- $\ln(1+x)\sim x$。
- $e^x-1\sim x$。
- $(1+x)^\alpha-1\sim \alpha x$。

### 0.2 一元积分技巧

- 分部积分：有 $x e^x$、$x\sin x$、$\ln x$、反三角函数时常用。
- 换元积分：根号、三角、指数复合优先。
- 有理式：先拆分，再部分分式。
- 定积分对称性：
  - 区间 $[-a,a]$ 上奇函数积分为 0。
  - 偶函数积分为 $2\int_0^a f(x)\,dx$。

## 1. 空间解析几何

### 1.1 向量基础

- 点积：$\vec a\cdot\vec b=|\vec a||\vec b|\cos\theta$，用于夹角、投影。
- 叉积：$\vec a\times\vec b$ 垂直于两向量，用于法向量、面积。
- 混合积：$(\vec a,\vec b,\vec c)=\vec a\cdot(\vec b\times\vec c)$，用于体积和共面判定。

### 1.2 平面与直线

平面点法式：

$$
\vec n\cdot(\vec r-\vec r_0)=0
$$

直线参数式：

$$
\vec r=\vec r_0+t\vec v
$$

两平面交线方向：

$$
\vec v=\vec n_1\times \vec n_2
$$

距离题：

- 点到平面：代入一般式除以法向量模。
- 点到直线：用叉积面积公式。
- 异面直线距离：用混合积除以方向叉积的模。

### 1.3 曲面与切平面

显式曲面 $z=f(x,y)$ 在 $(x_0,y_0,z_0)$ 的切平面：

$$
z-z_0=f_x(x_0,y_0)(x-x_0)+f_y(x_0,y_0)(y-y_0)
$$

隐式曲面 $F(x,y,z)=0$ 的切平面：

$$
F_x(x_0,y_0,z_0)(x-x_0)+F_y(y-y_0)+F_z(z-z_0)=0
$$

法线方向是 $\nabla F$。

> [!warning] 易错
> 曲线的切向量和曲面的法向量不是一回事。两曲面交线的切向量是两个法向量的叉积。

## 2. 多元函数微分学

### 2.1 偏导、连续、可微

关系链：

$$
偏导连续 \Rightarrow 可微 \Rightarrow 连续 \Rightarrow 极限存在
$$

但反过来一般不成立。尤其：

- 偏导存在不推出连续。
- 偏导存在不推出可微。
- 可微才可以使用线性主部：

$$
\Delta z=f_x\Delta x+f_y\Delta y+o(\rho)
$$

### 2.2 全微分

$$
dz=f_xdx+f_ydy
$$

近似计算：

$$
f(x+\Delta x,y+\Delta y)\approx f(x,y)+f_x\Delta x+f_y\Delta y
$$

### 2.3 方向导数与梯度

单位方向 $\vec u$ 上：

$$
D_{\vec u}f=\nabla f\cdot \vec u
$$

- 最大方向导数为 $|\nabla f|$。
- 最大增长方向为 $\nabla f$。
- 等值线/等值面上，梯度垂直于切线/切平面。

### 2.4 复合函数求导

做法：画依赖图。

若 $z=f(u,v)$，$u=u(x,y)$，$v=v(x,y)$：

$$
\frac{\partial z}{\partial x}=f_u u_x+f_v v_x
$$

$$
\frac{\partial z}{\partial y}=f_u u_y+f_v v_y
$$

抽象函数题不要急着展开，保留 $f_1,f_2$ 或 $f_u,f_v$。

### 2.5 隐函数

若 $F(x,y)=0$：

$$
\frac{dy}{dx}=-\frac{F_x}{F_y}
$$

若 $F(x,y,z)=0$，$z=z(x,y)$：

$$
z_x=-\frac{F_x}{F_z},\qquad z_y=-\frac{F_y}{F_z}
$$

### 2.6 极值与条件极值

无条件极值：

1. 解驻点：$f_x=0,f_y=0$。
2. 算 $A=f_{xx},B=f_{xy},C=f_{yy}$。
3. 判别式 $D=AC-B^2$。
   - $D>0,A>0$：极小。
   - $D>0,A<0$：极大。
   - $D<0$：鞍点。
   - $D=0$：另判。

条件极值：

$$
\nabla f=\lambda \nabla g,\qquad g(x,y)=0
$$

多约束就引入多个乘子。

## 3. 重积分

### 3.1 二重积分

直角坐标：

$$
\iint_D f(x,y)\,dA=\int_a^b\int_{\varphi_1(x)}^{\varphi_2(x)}f(x,y)\,dy\,dx
$$

极坐标：

$$
x=r\cos\theta,\quad y=r\sin\theta,\quad dA=r\,dr\,d\theta
$$

优先用极坐标的信号：

- 区域是圆、扇形、圆环。
- integrand 出现 $x^2+y^2$。
- 边界形如 $x^2+y^2=ax$。

### 3.2 三重积分

柱坐标：

$$
x=r\cos\theta,\quad y=r\sin\theta,\quad z=z,\quad dV=r\,dr\,d\theta\,dz
$$

球坐标：

$$
x=\rho\sin\varphi\cos\theta,\quad y=\rho\sin\varphi\sin\theta,\quad z=\rho\cos\varphi
$$

$$
dV=\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta
$$

球坐标适合球面、锥面、含 $x^2+y^2+z^2$ 的题；柱坐标适合绕 $z$ 轴旋转的柱/锥/抛物面。

### 3.3 换序

换序题步骤：

1. 从原积分限写出不等式组。
2. 画区域或至少确定投影。
3. 换另一变量外层范围。
4. 重新写内层上下界。

> [!tip] 检查
> 换序后区域必须完全一样。可以拿一个边界交点代回两边检验。

## 4. 曲线积分

### 4.1 第一类曲线积分

$$
\int_L f(x,y,z)\,ds
$$

参数化 $\vec r(t)$ 后：

$$
ds=|\vec r'(t)|\,dt
$$

第一类没有方向；换方向不变。

### 4.2 第二类曲线积分

$$
\int_L P\,dx+Q\,dy+R\,dz
$$

参数化后：

$$
\int_\alpha^\beta [P x'(t)+Q y'(t)+R z'(t)]\,dt
$$

第二类有方向，反向积分变号。

### 4.3 Green 公式

平面闭曲线 $L$ 正向为逆时针：

$$
\oint_L P\,dx+Q\,dy=\iint_D\left(\frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}\right)dA
$$

有奇点时：

- 奇点不在区域内：直接用。
- 奇点在区域内：挖小圆，算补边。
- 曲线不闭合：补线段使其闭合。

### 4.4 保守场

若存在势函数 $\phi$，使 $\nabla\phi=(P,Q,R)$，则：

$$
\int_A^B Pdx+Qdy+Rdz=\phi(B)-\phi(A)
$$

判定常用：在单连通区域内 $\nabla\times \vec F=0$。

## 5. 曲面积分

### 5.1 第一类曲面积分

$$
\iint_\Sigma f(x,y,z)\,dS
$$

若曲面 $z=z(x,y)$：

$$
dS=\sqrt{1+z_x^2+z_y^2}\,dx\,dy
$$

第一类无方向。

### 5.2 第二类曲面积分

通量积分：

$$
\iint_\Sigma P\,dy\,dz+Q\,dz\,dx+R\,dx\,dy
$$

有方向，先确定法向。投影到 $xy$ 面时，若取上侧：

$$
dy\,dz=-z_xdxdy,\quad dz\,dx=-z_ydxdy,\quad dx\,dy=dxdy
$$

### 5.3 Gauss 公式

闭曲面外法向：

$$
\iint_{\partial V}\vec F\cdot \vec n\,dS=\iiint_V \nabla\cdot \vec F\,dV
$$

非闭曲面常补面；补面要算完后减掉。

### 5.4 Stokes 公式

$$
\oint_{\partial S}\vec F\cdot d\vec r=\iint_S(\nabla\times \vec F)\cdot \vec n\,dS
$$

右手定则：四指沿边界正向，拇指为法向。

## 6. 无穷级数

### 6.1 数项级数

正项级数：

- 比较判别：和已知级数比。
- 等价判别：$a_n\sim b_n$。
- 比值判别：适合阶乘、指数。
- 根值判别：适合 $n$ 次幂。
- 积分判别：适合单调正函数。

常见标杆：

- $\sum 1/n^p$：$p>1$ 收敛，$p\le 1$ 发散。
- 几何级数：$|q|<1$ 收敛。

### 6.2 交错级数

Leibniz 判别：

1. $a_n$ 单调递减。
2. $a_n\to 0$。

还要继续判断绝对收敛还是条件收敛。

### 6.3 幂级数

步骤：

1. 用比值/根值求收敛半径 $R$。
2. 得区间 $(x_0-R,x_0+R)$。
3. 单独检查两个端点。

### 6.4 Taylor 展开与求和

常见套路：

- 把目标改写成已知展开。
- 对已知幂级数逐项积分/求导。
- 注意收敛域随求导积分可能端点变化。

### 6.5 Fourier 级数

- 周期 $2l$：

$$
f(x)\sim \frac{a_0}{2}+\sum_{n=1}^{\infty}\left(a_n\cos\frac{n\pi x}{l}+b_n\sin\frac{n\pi x}{l}\right)
$$

- 偶函数只有余弦项。
- 奇函数只有正弦项。
- 间断点处收敛到左右极限平均值。

## 7. 证明题

常见切入：

- 不等式：构造函数，求导看单调/极值。
- 含积分：用积分中值定理、换序、对称性。
- 含向量分析：凑 Green/Gauss/Stokes。
- 含级数：比较、放缩、Taylor 余项。

证明题写法：

1. 明确要证什么。
2. 选函数或区域。
3. 写出关键定理条件。
4. 推导到目标形式。

## 考前自测清单

- [ ] 能默写常用 Taylor 展开。
- [ ] 能从区域图写二重/三重积分限。
- [ ] 能判断用 Green、Gauss 还是 Stokes。
- [ ] 能处理曲线/曲面积分方向。
- [ ] 能求幂级数收敛域并检查端点。
- [ ] 能用 Lagrange 乘数法做条件极值。

