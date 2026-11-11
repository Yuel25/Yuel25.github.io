---
title: 平衡树（AVL · Splay · 红黑树）
tags:
  - 课程/ADS
---

# 平衡树（AVL · Splay · 红黑树）

> [!abstract] 导览
> 本文整理三种自调整二叉搜索树：**AVL 树**、**伸展树（Splay Tree）**和**红黑树（Red-Black Tree）**。重点是各自维持的平衡不变式、手算修复过程与复杂度保证。代码为突出算法的 C 风格参考实现，省略内存分配失败处理和测试主程序。
>
> 对应讲义：[[讲义/lec01_AVL树-Splay树-摊还分析.pdf|lec01 AVL、Splay 与摊还分析]]；[[讲义/lec02_红黑树-B+树.pdf|lec02 红黑树与 B+ 树]]（本篇取红黑树部分）。
>
> - [[#1. 为什么需要平衡树]] —— 问题动机
> - [[#2. 旋转：一切平衡操作的基础]] —— 左旋 / 右旋
> - [[#3. AVL 树]] —— 高度严格平衡
> - [[#4. Splay 树（伸展树）]] —— 摊还意义下平衡
> - [[#5. 红黑树]] —— 黑高平衡
> - [[#6. 三种树的对比总结]] —— 保证与适用场景
> - [[#7. 我的理解与思考]] —— 个人归纳
> - [[#8. 考点速查]] —— 不变式、手算与复杂度
> - [[#9. 参考]] —— 讲义与教材

---

## 1. 为什么需要平衡树

普通二叉搜索树（BST）的查找、插入、删除代价都是 **$O(h)$**，其中 $h$ 为树高。平衡时 $h=O(\log n)$；若按 $1,2,\ldots,n$ 依次插入且不调整，树会退化成链，单趟操作最坏变为 $O(n)$。

> [!warning] 本篇的高度口径
> 讲义统一采用**边数高度**：空树高 $-1$，单结点树高 $0$，树高是根到最深叶子的边数；因此 $n$ 结点链的高度是 $n-1$。后文 AVL 的 C 代码为常见的实现方便改用**结点数高度**：空树为 $0$、叶子为 $1$。两种口径相差 1，递推初值和公式不能混用；对数均默认以 2 为底。

**平衡树的核心思想**是在搜索树有序性之外增加结构约束，并用局部旋转维护它。但 Splay 是例外：它不保证每次操作后的树高为 $O(\log n)$，只保证一整串操作的总成本具有对数摊还界。

| 树 | 维持的信息与策略 | 能保证什么 |
|---|---|---|
| AVL | 每个内部结点左右子树高度差至多 1 | 单次查找、插入、删除最坏 $O(\log n)$ |
| Splay | 不存平衡元数据；访问后把目标伸展到根 | 单次可 $O(n)$，任意合法操作序列摊还 $O(\log n)$ |
| 红黑树 | 根与 NIL 为黑、无连续红结点、各路径黑高一致 | 单次查找、插入、删除最坏 $O(\log n)$，旋转次数有常数上界 |

---

## 2. 旋转：一切平衡操作的基础

旋转是 O(1) 的局部操作，只改几条指针，**不改变 BST 的中序遍历结果**（这是它能保持有序性的原因）。

### 2.1 右旋（rotate right）

以 `y` 为轴，把其左孩子 `x` 提上来：

```text
     y                 x
    / \               / \
   x   C    ====>    A   y
  / \                   / \
 A   B                 B   C
```

```c
/* 右旋：返回旋转后的子树根 */
Node* rotateRight(Node* y) {
    Node* x  = y->left;
    Node* B  = x->right;
    x->right = y;
    y->left  = B;
    return x;              /* x 成为新的子树根 */
}
```

### 2.2 左旋（rotate left）

以 `x` 为轴，把其右孩子 `y` 提上来：

```text
   x                     y
  / \                   / \
 A   y      ====>      x   C
    / \               / \
   B   C             A   B
```

```c
/* 左旋：返回旋转后的子树根 */
Node* rotateLeft(Node* x) {
    Node* y = x->right;
    Node* B = y->left;
    y->left  = x;
    x->right = B;
    return y;              /* y 成为新的子树根 */
}
```

> [!tip] 旋转的三个检查点
> 左旋把**右孩子**提上来，右旋把**左孩子**提上来；旋转方向与被提升孩子原来所在的一侧相反。
>
> 被挤出的中间子树 `B` 必须接回：右旋时 `B` 成为旧根的左子树，左旋时成为旧根的右子树。
>
> 旋转前后的中序序列分别是 $A,x,B,y,C$，因此 BST 有序性不变。AVL 旋转后要按“先旧根、后新根”的顺序更新高度；Splay 不维护高度；红黑树还要按修复规则处理颜色与父指针。

---

## 3. AVL 树

> 1962 年由 Adelson-Velsky 和 Landis 提出，是最早的自平衡 BST。

### 3.1 定义、高度递推与手算

AVL 树首先是 BST，并要求**每个结点**都满足：

$$\operatorname{bf}(v)=h(v.left)-h(v.right)\in\{-1,0,1\}$$

只检查根的左右高度差不够：两条等长链挂在根两边时根很平衡，整树高度却仍可为 $\Theta(n)$。

按讲义的边数高度，记 $N(h)$ 为高度恰为 $h$ 的 AVL 树所具有的最少结点数。最省结点的构造是一棵子树高 $h-1$，另一棵高 $h-2$，所以：

$$N(-1)=0,\qquad N(0)=1,\qquad N(h)=1+N(h-1)+N(h-2)\quad(h\ge1)$$

前几项如下，手算高度题可直接查：

| 高度 $h$ | -1 | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 最少结点数 $N(h)$ | 0 | 1 | 2 | 4 | 7 | 12 | 20 |

令 $M(h)=N(h)+1$，则 $M(h)=M(h-1)+M(h-2)\ge2M(h-2)$，归纳得 $M(h)\ge2^{(h+1)/2}$。因此含 $n$ 个结点的 AVL 树有：

$$n+1\ge2^{(h+1)/2}\quad\Longrightarrow\quad h\le2\log_2(n+1)-1$$

由同一递推的斐波那契增长还可得到更紧的渐近界 $h\lesssim1.4405\log_2 n+O(1)$。这说明 AVL 高度是对数级，但不表示实际查询永远优于红黑树；实现常数、缓存与更新频率也会影响性能。

**手算例：12 个结点能否高 5？** 不能。$N(4)=12$，所以 12 结点可以达到高度 4；而高度 5 至少需要 $N(5)=20$ 个结点，因此高度不可能超过 4。这里若误用“空树高 0”的代码口径，初值与答案都会错位。

### 3.2 四种插入失衡与旋转

插入只可能改变新结点到根这条祖先链上的子树高度。自新结点向上找到**最低**的失衡结点 $z$，插入前合法意味着此时 $\operatorname{bf}(z)$ 只会是 $+2$ 或 $-2$。

| 类型 | 从 $z$ 向插入位置的前两步 | 修复动作 |
|---|---|---|
| LL | 左、左 | 对 $z$ 右旋一次 |
| RR | 右、右 | 对 $z$ 左旋一次 |
| LR | 左、右 | 先对 $z.left$ 左旋，再对 $z$ 右旋 |
| RL | 右、左 | 先对 $z.right$ 右旋，再对 $z$ 左旋 |

**LL 手算：依次插入 30、20、10。**

```text
      30                 20
     /                  /  \
   20        右旋 30   10  30
   /
 10
```

旋转前中序为 `10 20 30`，旋转后仍相同。叶高为 0，插入 10 后 30 的左子树高 1、右子树高 -1，故 $\operatorname{bf}(30)=2$。

**LR 手算：依次插入 30、10、20。**

```text
   30          30            20
  /           /             /  \
10   左旋10  20    右旋30  10  30
  \         /
  20      10
```

若把 LR 当成 LL 只右旋 30，会让 10 的右侧仍然过深，不能恢复平衡。双旋的目的就是先把“折线”变成同向情形。

**为什么插入修复最低失衡结点后不再需要旋转祖先？** 四种修复都会使以 $z$ 为根的子树高度恢复到插入前的高度，祖先看到的子树高度不再变化。因此一次插入至多两次基本旋转。递归实现仍会在返回途中更新高度或检查平衡，但不需要再做旋转。

### 3.3 删除与插入的关键差别

先按普通 BST 删除：叶子直接摘除；只有一个孩子时用孩子接替；有两个孩子时可用右子树最小键替换，再递归删除那个后继。随后从实际摘除位置向上更新高度并修复。

删除时没有“新插入键”可用于判断 LL/LR，必须看较高孩子的平衡因子：

| 失衡结点 | 较高孩子 $p$ | 修复 |
|---|---|---|
| $\operatorname{bf}(z)=2$ | $\operatorname{bf}(z.left)\ge0$ | 对 $z$ 右旋 |
| $\operatorname{bf}(z)=2$ | $\operatorname{bf}(z.left)<0$ | 先左旋左孩子，再右旋 $z$ |
| $\operatorname{bf}(z)=-2$ | $\operatorname{bf}(z.right)\le0$ | 对 $z$ 左旋 |
| $\operatorname{bf}(z)=-2$ | $\operatorname{bf}(z.right)>0$ | 先右旋右孩子，再左旋 $z$ |

**删除特有的 $\operatorname{bf}(p)=0$：** 此时归入同向情形，用一次单旋即可，不能擅自改成双旋。例如下面的树删除 40：

```text
删除前             删除40后失衡       右旋30后
    30                 30               20
   /  \               /                /  \
 20   40    ==>     20        ==>    10  30
 /  \              /  \                  /
10  25            10  25               25
```

删除后 30 左高 1、右高 -1，而较高孩子 20 的 $\operatorname{bf}=0$。右旋后各结点恢复 AVL 条件，但这棵子树高度由原树的 2 降为 1；若 30 上面还有祖先，就必须继续检查。

与插入不同，删除修复后局部子树高度可能下降，失衡会继续向祖先传播，所以一次删除最多需要 $O(\log n)$ 次基本旋转。每次回溯都要先更新高度，再读取平衡因子。

### 3.4 AVL 参考 C 实现

以下代码采用“空树高 0、叶子高 1”的结点高度约定，与前文讲义口径相差 1；`height` 与 `bf` 内部必须始终使用同一约定。

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct AVLNode {
    int key;
    int height;                  /* 空树高度 0，叶子高度 1 */
    struct AVLNode *left, *right;
} AVLNode;

/* ---------- 基础工具 ---------- */
static int height(AVLNode* n)  { return n ? n->height : 0; }
static int max(int a, int b)   { return a > b ? a : b; }
static int bf(AVLNode* n)      { return n ? height(n->left) - height(n->right) : 0; }

static AVLNode* newNode(int key) {
    AVLNode* n = (AVLNode*)malloc(sizeof(AVLNode));
    n->key = key; n->height = 1; n->left = n->right = NULL;
    return n;
}

AVLNode* avlSearch(AVLNode* root, int key) {
    while (root && root->key != key)
        root = key < root->key ? root->left : root->right;
    return root;
}

/* ---------- 带高度更新的旋转 ---------- */
static AVLNode* rotateRight(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* B = x->right;
    x->right = y;  y->left = B;
    y->height = max(height(y->left), height(y->right)) + 1;
    x->height = max(height(x->left), height(x->right)) + 1;
    return x;
}

static AVLNode* rotateLeft(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* B = y->left;
    y->left = x;  x->right = B;
    x->height = max(height(x->left), height(x->right)) + 1;
    y->height = max(height(y->left), height(y->right)) + 1;
    return y;
}

/* ---------- 插入 ---------- */
AVLNode* avlInsert(AVLNode* root, int key) {
    /* 1. 普通 BST 插入 */
    if (!root) return newNode(key);
    if (key < root->key)      root->left  = avlInsert(root->left, key);
    else if (key > root->key) root->right = avlInsert(root->right, key);
    else return root;                       /* 重复键：直接返回 */

    /* 2. 更新高度 */
    root->height = 1 + max(height(root->left), height(root->right));

    /* 3. 按插入键值判定四种失衡并修复（插入只需修一次） */
    int b = bf(root);
    if (b >  1 && key < root->left->key)                     /* LL */
        return rotateRight(root);
    if (b < -1 && key > root->right->key)                    /* RR */
        return rotateLeft(root);
    if (b >  1 && key > root->left->key) {                   /* LR */
        root->left = rotateLeft(root->left);
        return rotateRight(root);
    }
    if (b < -1 && key < root->right->key) {                  /* RL */
        root->right = rotateRight(root->right);
        return rotateLeft(root);
    }
    return root;
}

/* ---------- 删除 ---------- */
static AVLNode* minNode(AVLNode* n) {
    while (n->left) n = n->left;
    return n;
}

AVLNode* avlDelete(AVLNode* root, int key) {
    /* 1. 普通 BST 删除 */
    if (!root) return NULL;
    if (key < root->key)      root->left  = avlDelete(root->left, key);
    else if (key > root->key) root->right = avlDelete(root->right, key);
    else {
        if (!root->left || !root->right) {              /* 0 或 1 个孩子 */
            AVLNode* tmp = root->left ? root->left : root->right;
            if (!tmp) { tmp = root; root = NULL; }      /* 叶子 */
            else *root = *tmp;                          /* 用孩子顶替（复制内容，不改指针） */
            free(tmp);
        } else {                                        /* 2 个孩子 */
            AVLNode* succ = minNode(root->right);       /* 后继 = 右子树最小 */
            root->key = succ->key;
            root->right = avlDelete(root->right, succ->key);
        }
    }
    if (!root) return NULL;

    /* 2. 更新高度 */
    root->height = 1 + max(height(root->left), height(root->right));

    /* 3. 按平衡因子判定失衡并修复（删除需逐层向上检查） */
    int b = bf(root);
    if (b > 1 && bf(root->left)  >= 0) return rotateRight(root);          /* LL */
    if (b > 1 && bf(root->left)  <  0) {                                   /* LR */
        root->left = rotateLeft(root->left);
        return rotateRight(root);
    }
    if (b < -1 && bf(root->right) <= 0) return rotateLeft(root);          /* RR */
    if (b < -1 && bf(root->right) >  0) {                                  /* RL */
        root->right = rotateRight(root->right);
        return rotateLeft(root);
    }
    return root;
}

/* ---------- 中序遍历（验证有序性） ---------- */
void inorder(AVLNode* root) {
    if (!root) return;
    inorder(root->left);
    printf("%d ", root->key);
    inorder(root->right);
}
```

> [!note] 实现要点
> - 删除时不用“插入键值”，而用**子树平衡因子的符号**判断，因为不存在可用于分类的新结点。
>
> - `b > 1 && bf(root->left) >= 0` 中的 `>=` 必须保留：左孩子 `bf = 0` 是删除特有的同向单旋情形，不应当作 LR 双旋。
>
> - 旋转函数先更新旧根，再更新新根；否则新根会读到旧根的过期高度。
>
> - 递归通过“返回局部新根”替换父结点的孩子指针，因此不显式使用父指针；删除的逐层回溯正是向上传播检查的过程。

---

## 4. Splay 树（伸展树）

> Sleator 与 Tarjan 1985 年提出。**不存储任何平衡信息**，每次访问一个节点 x 后，通过一系列旋转把 x 搬到根，称为 **splay(x)**。只要操作序列有局部性（刚访问过的节点很可能再次被访问），实际性能极好；且所有操作的**摊还**代价都是 O(log n)。

### 4.1 核心操作：splay(x)

设 p 为 x 的父节点，g 为祖父节点（根节点的父节点视为空）：

| 情形 | 条件 | 操作 | 名称 |
|---|---|---|---|
| **zig** | p 是根 | 单旋一次（x 在左则右旋，反之左旋），结束 | 基础步 |
| **zig-zig** | x、p 同为左孩子（或同为右孩子） | **先**旋转 p-g，**再**旋转 x-p | 一字型 |
| **zig-zag** | x 为右孩子、p 为左孩子（或反之） | **先**旋转 x-p，**再**旋转 x-g | 之字型 |

```text
zig-zig（左左，两步都是右旋）:
      g                x
     / \              / \
    p   D  ====>     A   p
   / \                  / \
  x   C                B   g
 / \                      / \
A   B                    C   D

zig-zag（左右，先左旋再右旋）:
    g                    x
   / \                 /   \
  p   D   ====>       p     g
 / \                 / \   / \
A   x               A   B C   D
   / \
  B   C
```

> [!important] zig-zig 不能交换旋转顺序
> zig-zig 必须**先旋转祖父—父亲，再旋转父亲—目标**。它与 zig-zag 都是两次基本旋转，但一字型与之字型形成的子树不同。
>
> 若一字型也采用 naive move-to-root 的“先旋父亲、再旋祖父”，讲义的构造表明：插入再访问共 $2N$ 次操作，仅旋转成本就可达到 $\Theta(N^2)$，即摊还 $\Theta(N)$，并非对数摊还界。
>
> **手算顺序：**从空树依次插入 $1,\ldots,7$ 并每次都伸展新结点，得到根 7 的左斜链。访问 1 时依次处理 $(1,2,3)$、$(1,4,5)$、$(1,6,7)$，共三组 zig-zig、六次右旋；1 的深度由 6 降为 0。

终止条件：x 到根为止。若中途发现 key 不在树中，把**搜索路径的最后一个节点**伸展到根。

### 4.2 由 splay 构成的全部操作

Splay 树的所有操作只需一个原语：对根执行 `splay(key)`。

- **查找**：`root = splay(root, key)`，看新根是否等于 key。
- **插入**：
  1. `root = splay(root, key)`；
  2. 若根已是 key，结束（重复键）；
  3. 新建节点 n，利用 BST 性质**分裂**：
     - `key < root->key`：`n->left = root->left; n->right = root; root->left = NULL;`
     - `key > root->key`：镜像。
  4. 返回 n 为根。插入第 3 步本质是按新键分裂为“$<key$”与“$>key$”两部分；若单独实现通用的 `split(t,key)`，必须先另外约定边界键归入哪一侧，不能与此处无重复键的插入混写。
- **删除**：
  1. `root = splay(root, key)`，不存在则返回；
  2. 此时 root 无父节点，左右子树 L、R 独立：摘下并释放 root；
  3. 若 L 非空：`L = splay(L, key)`（key 不在 L 中，会把 **L 中最大元**提到 L 的根，且其右子树必空），令 `L->right = R`，返回 L；否则返回 R。`join(L, R)`（合并两棵所有键 < 所有键的树）同理。

### 4.3 势能与摊还：从单步界到访问引理

**摊还不是概率平均。** 它不要求每次操作都为 $O(\log n)$，而是要求任意合法操作序列的总成本有上界。势能法为结构状态 $D_i$ 定义 $\Phi(D_i)$，第 $i$ 步摊还成本为：

$$\widehat c_i=c_i+\Phi(D_i)-\Phi(D_{i-1})$$

对整串操作伸缩求和：

$$\sum_{i=1}^{m}c_i=\sum_{i=1}^{m}\widehat c_i+\Phi(D_0)-\Phi(D_m)$$

若从空结构开始且 $\Phi(D_0)=0$、势能始终非负，就有 $\sum c_i\le\sum\widehat c_i$。非空初态不能随手忽略，必须保留相应的初始势能项。

对 Splay 树，令 $s(v)$ 是以 $v$ 为根的子树结点数，定义：

$$r(v)=\log_2s(v),\qquad \Phi(T)=\sum_{v\in T}r(v),\qquad \Phi(\varnothing)=0$$

一次基本旋转只改变参与旋转结点的子树大小，因此可以局部计算 $\Delta\Phi$。证明还会用到对数不等式：若 $a,b>0$ 且 $a+b\le c$，则由 $ab\le(c/2)^2$ 得：

$$\log a+\log b\le2\log c-2$$

设一步旋转前目标 $x$ 的秩为 $r(x)$，旋转后为 $r'(x)$；以基本旋转次数计实际成本，则三类步骤满足：

| 步骤 | 实际旋转数 | 摊还成本上界 | 证明中使用的关键子树关系 |
|---|---:|---|---|
| zig | 1 | $1+3(r'(x)-r(x))$ | 只有 $x,p$ 的秩改变，$r'(p)\le r(p)$ |
| zig-zag | 2 | $2(r'(x)-r(x))\le3(r'(x)-r(x))$ | 旋转后 $p,g$ 的两棵子树不相交 |
| zig-zig | 2 | $3(r'(x)-r(x))$ | 旋转前 $x$ 的子树与旋转后 $g$ 的子树不相交 |

zig-zig 的最后一行正是依赖“先祖父、后父亲”的顺序；naive move-to-root 无法保证同一个大小关系。

把一次 splay 的所有步骤相加，中间秩全部消去。若原根为 $t$，基本旋转总数为 $C$，得到**访问引理**：

$$C+\Delta\Phi\le1+3\bigl(r(t)-r(x)\bigr)\le1+3\log_2n$$

最后的 $1$ 来自至多一次、且只可能出现在末尾的 zig。这里不是“每组旋转都使秩至少加 1”：秩增量可以很小，结论来自各步代数和势能变化的联合估计。

**把查找成本也计入：** 若目标原深度为 $d$，查找访问 $d+1$ 个结点，伸展需要 $d$ 次基本旋转。取足够大的常数 $K$ 覆盖比较与指针更新，并把势函数整体缩放为 $\Psi=K\Phi$，仍可得到一次完整访问的摊还成本 $O(\log(n+1))$。

插入新叶会使其祖先的子树大小各增加 1，接入叶子带来的势能额外增加至多 $\log(n+1)$；删除根与拼接左右子树带来的势能增加也可由对数项覆盖。因此搜索、插入、删除均为 $O(\log(n+1))$ 摊还时间。

从空树开始执行 $m$ 次操作，若过程中结点数至多 $N$，总时间为 $O(m\log(N+1))$。若初始树任意且含 $n_0$ 个结点，上述分析给出的总上界还包含初始势能项：

$$O\bigl(m\log(N+1)+n_0\log(n_0+1)\bigr)$$

> [!warning] 单次最坏与整串总成本要分开
> 把最深的叶子伸展到根仍可需要 $\Theta(n)$ 次旋转。Splay 的保证是整串操作的摊还上界，不是单次最坏上界，也不是在某种随机分布下求平均。

**加权势能（讲义补充）：** 给每个键固定正权重 $w(v)$，把 $s(v)$ 改成子树权重和，同样的包含关系与对数不等式仍成立。总权重为 $W$ 时，成功访问 $x$ 的旋转摊还界可写为 $1+3\log(W/w(x))$。权重只用于证明，算法不需要预知访问频率；至于 Splay 是否与知道未来的最优动态树仅差常数倍，即动态最优猜想，仍是公开问题。

### 4.4 Splay 参考 C 实现（递归版）

用"返回新根"的递归写法，天然不需要父指针：

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct SNode {
    int key;
    struct SNode *left, *right;
} SNode;

/* ---------- 与前面相同的旋转（Splay 不维护高度，无需更新） ---------- */
static SNode* rotateRight(SNode* y) {
    SNode* x = y->left;
    y->left = x->right;
    x->right = y;
    return x;
}
static SNode* rotateLeft(SNode* x) {
    SNode* y = x->right;
    x->right = y->left;
    y->left = x;
    return y;
}

/* ---------- 核心：把 key 伸展到根（key 不在树中则伸展最后访问的节点） ---------- */
SNode* splay(SNode* root, int key) {
    if (!root || root->key == key) return root;

    if (key < root->key) {                          /* 目标在左子树 */
        if (!root->left) return root;               /* 不存在：root 就是最后访问点 */
        if (key < root->left->key) {                /* zig-zig（左左） */
            root->left->left = splay(root->left->left, key);
            root = rotateRight(root);               /* 先旋祖父层 */
        } else if (key > root->left->key) {         /* zig-zag（左右） */
            root->left->right = splay(root->left->right, key);
            if (root->left->right)
                root->left = rotateLeft(root->left);
        }
        /* 到这里 root->left 就是要上提的节点（或其最近邻） */
        return root->left ? rotateRight(root) : root;   /* 最后补一次 zig */
    } else {                                        /* 目标在右子树，完全镜像 */
        if (!root->right) return root;
        if (key > root->right->key) {               /* zig-zig（右右） */
            root->right->right = splay(root->right->right, key);
            root = rotateLeft(root);
        } else if (key < root->right->key) {        /* zig-zag（右左） */
            root->right->left = splay(root->right->left, key);
            if (root->right->left)
                root->right = rotateRight(root->right);
        }
        return root->right ? rotateLeft(root) : root;
    }
}

/* ---------- 查找 ---------- */
SNode* splayFind(SNode* root, int key) {
    return splay(root, key);                        /* 找不到时返回最后访问节点为根 */
}

/* ---------- 插入 ---------- */
SNode* splayInsert(SNode* root, int key) {
    if (!root) {
        SNode* n = (SNode*)malloc(sizeof(SNode));
        n->key = key; n->left = n->right = NULL;
        return n;
    }
    root = splay(root, key);
    if (root->key == key) return root;              /* 已存在 */

    SNode* n = (SNode*)malloc(sizeof(SNode));
    n->key = key; n->left = n->right = NULL;
    if (key < root->key) {          /* 分裂：root 及其右子树挂到 n 右边 */
        n->left = root->left;
        n->right = root;
        root->left = NULL;
    } else {                        /* 镜像 */
        n->right = root->right;
        n->left = root;
        root->right = NULL;
    }
    return n;
}

/* ---------- 删除 ---------- */
SNode* splayDelete(SNode* root, int key) {
    if (!root) return NULL;
    root = splay(root, key);
    if (root->key != key) return root;              /* 不存在 */

    SNode* L = root->left;
    SNode* R = root->right;
    free(root);
    if (!L) return R;
    L = splay(L, key);                              /* 把 L 的最大元提到根 */
    L->right = R;                                   /* join */
    return L;
}

void inorderS(SNode* root) {
    if (!root) return;
    inorderS(root->left);
    printf("%d ", root->key);
    inorderS(root->right);
}
```

> [!note] 实现要点
> - 递归版 splay 的 zig-zig 是"先递归到底、旋转时在回溯中完成"，代码顺序与图示的"先旋 g-p 再旋 p-x"一致。
> - 删除第 3 步 `splay(L, key)` 中 key 必然不在 L 里，splay 会把查找路径终点（即 L 中的最大键）提为 L 的根，且该根**没有右子树**，正好挂 R。
> - 如需 `split(t, key)` / `join(a, b)` 操作，与插入 / 删除中相应步骤完全相同，可独立封装。

---

## 5. 红黑树

> 1972 年由 Rudolf Bayer 发明（当时叫 symmetric binary B-tree），1978 年被 Guibas 和 Sedgewick 改造并命名。它是 **C++ `std::map` / `std::set`、Java `TreeMap`、Linux CFS 调度器**的底层结构——因为插入、删除的旋转次数有严格上界，常数小且稳定。

### 5.1 五条性质、黑高与高度证明

1. 每个结点非红即黑。
2. 根结点是黑色。
3. 每个外部叶结点 **NIL** 是黑色；NIL 不保存键，含键结点称为内部结点。
4. 红结点的两个孩子都是黑色，即不存在相邻的红—红父子。
5. 对每个结点，从它到各后代 NIL 的简单路径包含相同数量的黑结点。

NIL 不能省略不计。若把一条全黑链的普通空指针不当成叶，就可能误以为它满足黑高条件；补上 NIL 后，不同路径的黑色计数会暴露失衡。

**黑高 $\operatorname{bh}(x)$** 定义为从 $x$ 到后代 NIL 的路径上的黑结点数，**不含 $x$ 自己、包含末端 NIL**；特别地 $\operatorname{bh}(NIL)=0$。性质 5 保证这个数与选哪条路径无关。

以 $x$ 为根的子树内部结点数 $n_x$ 满足：

$$n_x\ge2^{\operatorname{bh}(x)}-1$$

可用结构归纳证明：NIL 时两边都为 0；内部结点的孩子若黑，其黑高为 $\operatorname{bh}(x)-1$，若红则至少可按 $\operatorname{bh}(x)$ 的下界处理，两个孩子合起来即得结论。对根有 $n\ge2^{\operatorname{bh}(root)}-1$，故 $\operatorname{bh}(root)\le\log_2(n+1)$。

从根到 NIL 的路径不计根而计 NIL，恰含 $\operatorname{bh}(root)$ 个黑结点。红结点不能相邻且末端 NIL 为黑，所以红结点数不超过黑结点数，路径边数至多 $2\operatorname{bh}(root)$。因此：

$$\boxed{h\le2\log_2(n+1)}$$

并且同一结点到 NIL 的最长路径至多是最短路径的两倍。这里比较的是根到**外部 NIL** 的路径，不能只数含键结点。

**黑高手算：** 根 20 为黑，左右孩子 10、30 均为黑，其他孩子为 NIL，则 $\operatorname{bh}(20)=2$：不计 20，路径经过一个孩子与 NIL，共两个黑结点。若在 10 下插入红结点 5，各路径黑高仍为 2；新红结点只增加路径长度，不增加黑色计数。

### 5.2 与 2-3-4 树的对应

红黑树不是用“左右高度差”约束，而是用严格的黑高加受限的红结点维持对数高度。把每个黑结点与其红孩子合并，就得到一个 **2-3-4 B 树**结点：

- 一个黑键对应 2-结点；
- 黑父亲带一个红孩子对应含两个键的 3-结点，红孩子可在左或右，因此同一 B 树结点可有不同二叉表示；
- 黑父亲带两个红孩子对应含三个键的 4-结点。

黑高相等使合并后的所有叶同深。插入中的改色、旋转可用 2-3-4 树的分裂或结点表示变化理解；删除也可借助借位与合并理解。这是对应关系，不表示红黑树在内存中真的保存了 B 树结点。

### 5.3 插入修复

新节点 z 染**红色**插入（不增加任何路径的黑高，所以只会违反性质 2 或 4）。若父节点是黑色则结束；父节点为红时按**叔叔节点 u** 的颜色分三种情况（设父节点为左孩子）：

以下均设父亲 $p$ 是祖父 $g$ 的左孩子；右侧情形完全镜像。叔叔为 NIL 时按黑色处理。

| 情形 | 当前特征 | 修复与去向 |
|---|---|---|
| Case 1 | 叔叔红 | 父亲、叔叔染黑，祖父染红；把祖父作为新的 $z$，向上继续 |
| Case 2 | 叔叔黑，$z$ 是父亲的右孩子（折线） | 对父亲左旋并令 $z$ 指向原父亲，转为 Case 3 |
| Case 3 | 叔叔黑，$z$ 是父亲的左孩子（同向） | 父亲染黑、祖父染红，对祖父右旋，结束 |

Case 1 中祖父原本必为黑，因为原树合法且父亲为红。把父亲与叔叔染黑、祖父染红，不会改变经过祖父的黑结点计数；但祖父与其父亲可能形成新的红红冲突，因此问题向上移动两层。若祖父是根，最后直接染黑，所有根到 NIL 路径的黑色数同时加 1。

```text
Case 2 → Case 3（只画相关链）     Case 3：改色并右旋 g
    g(黑)          g(黑)                 p(黑)
   /              /                     /    \
 p(红)   左旋p  z(红)      =====>     z(红)  g(红)
   \              /                              \
   z(红)        p(红)                            原子树按序接回
```

Case 2 的旋转不改颜色；Case 3 后局部新根为黑，红红冲突消失。故插入最多 **2 次基本旋转**，改色可能沿祖先链发生 $O(\log n)$ 次，总时间仍为 $O(\log n)$。

**手算例：依次插入 10、20、30、15。**

1. 插入 10 为根，染黑。
2. 插入红 20，父亲是黑，无需修复。
3. 插入红 30 后出现 10—20—30 的右右同向链，叔叔 NIL 为黑；对 10 左旋并改色，得到黑根 20，左右孩子 10、30 均为红。
4. 插入红 15 到红结点 10 下，叔叔 30 为红，进入 Case 1：10、30 染黑，20 染红；20 是根，最后染黑，15 保持红色。

最终根 20 为黑，10、30 为黑，15 为红。检查每条到 NIL 的路径都有相同黑色计数，且没有红红相邻。

### 5.4 删除：真正摘除的颜色与双黑修复

BST 删除中，真正摘除的结点 $y$ 至多只有一个内部孩子。若原目标有两个孩子，可让后继 $y$ 顶替原位置，**颜色随位置保留或按后继移动规则处理**，再摘除原来的后继；不能简单交换两个结点颜色而忽略路径黑高。

先区分三种不需完整双黑循环的情况：

- 摘除红结点：黑色计数不变，也不会留下新的红红冲突，可直接删除。
- 摘除黑结点而接替者 $x$ 为红：把 $x$ 染黑，正好补回少掉的黑色。
- 摘除黑结点且接替者也是黑（包括黑色 NIL）：该位置需要携带一重“额外黑色”，称为**双黑**。双黑不是第三种合法颜色，而是修复过程中的记账方式。

以下设双黑 $x$ 是父亲 $p$ 的左孩子，兄弟为 $w$；$w.left$ 是近侄子，$w.right$ 是远侄子。右侧情形全部镜像。

| 情形 | 特征 | 修复与去向 |
|---|---|---|
| Case 1 | 兄弟 $w$ 红 | $w$ 染黑、$p$ 染红、左旋 $p$；双黑仍在 $x$，但新兄弟变黑，转入 Case 2/3/4 |
| Case 2 | $w$ 黑，两个侄子均黑 | $w$ 染红，去掉 $x$ 的额外黑色并把额外黑色上推给 $p$；$p$ 红则染黑结束，$p$ 黑则继续 |
| Case 3 | $w$ 黑，近侄子红、远侄子黑 | 近侄子染黑、$w$ 染红、右旋 $w$，转为 Case 4 |
| Case 4 | $w$ 黑，远侄子红，近侄子任意 | $w$ 继承 $p$ 的颜色，$p$ 与远侄子染黑，左旋 $p$，消除额外黑色并结束 |

Case 2 可能沿祖先链上推 $O(\log n)$ 次，但只做改色。Case 1、3、4 在结束前合计至多三次旋转：Case 1 一次，Case 3 一次，Case 4 一次。若 Case 1 后进入 Case 2，此时父亲为红，会立即结束。

**Case 2 手算：** 初始树为黑根 20，左右孩子 10、30 均黑，其余孩子为 NIL。删除黑色叶子 10，接替它的 NIL 成为双黑。

```text
删除10后（x 为双黑 NIL）       Case 2 后
          20B                         20B
         /   \          ==>             \
       xBB   30B                        30R
```

兄弟 30 为黑，两个侄子 NIL 均黑，所以 30 染红，额外黑色上推给父亲 20。20 已是黑根，再吸收这重额外黑色仍为黑，直接结束。最终 20 的左 NIL 路径与经红 30 到 NIL 的路径都具有相同黑色计数。

> [!tip] 对称与实现
> $x$ 为右孩子时左右互换、左旋与右旋互换。代码可用 `if (x == x->parent->left)` 与镜像分支实现；双黑通常不需要额外字段，因为当前 $x$ 就是携带额外黑色的位置。

### 5.5 红黑树参考 C 实现

使用 CLRS 风格的 **NIL 哨兵节点**：所有空指针都指向同一个黑色哨兵，使"空"也能安全地读取颜色和子节点。

```c
#include <stdio.h>
#include <stdlib.h>

typedef enum { RED, BLACK } Color;
typedef struct RBNode {
    int key;
    Color color;
    struct RBNode *left, *right, *parent;
} RBNode;

/* NIL 哨兵：全局唯一，所有叶子/根的空指针都指向它 */
static RBNode NIL_NODE = {0, BLACK, &NIL_NODE, &NIL_NODE, &NIL_NODE};
#define NIL (&NIL_NODE)

typedef struct { RBNode* root; } RBTree;

/* ---------- 旋转（带父指针维护） ---------- */
static void leftRotate(RBTree* t, RBNode* x) {
    RBNode* y = x->right;
    x->right = y->left;                    /* B 子树移交 */
    if (y->left != NIL) y->left->parent = x;
    y->parent = x->parent;                 /* x 的父指针交给 y */
    if (x->parent == NIL)      t->root = y;
    else if (x == x->parent->left)  x->parent->left  = y;
    else                            x->parent->right = y;
    y->left = x;
    x->parent = y;
}

static void rightRotate(RBTree* t, RBNode* y) {   /* 完全镜像 */
    RBNode* x = y->left;
    y->left = x->right;
    if (x->right != NIL) x->right->parent = y;
    x->parent = y->parent;
    if (y->parent == NIL)      t->root = x;
    else if (y == y->parent->left)  y->parent->left  = x;
    else                            y->parent->right = x;
    x->right = y;
    y->parent = x;
}

/* ---------- 查找 ---------- */
RBNode* rbSearch(RBNode* root, int key) {
    while (root != NIL && root->key != key)
        root = key < root->key ? root->left : root->right;
    return root;
}

/* ---------- 插入 + 修复 ---------- */
static void rbInsertFixup(RBTree* t, RBNode* z) {
    while (z->parent->color == RED) {           /* 红红冲突 */
        if (z->parent == z->parent->parent->left) {
            RBNode* u = z->parent->parent->right;   /* 叔叔 */
            if (u->color == RED) {                  /* Case 1：改色上推 */
                z->parent->color = BLACK;
                u->color = BLACK;
                z->parent->parent->color = RED;
                z = z->parent->parent;
            } else {
                if (z == z->parent->right) {        /* Case 2：转成 Case 3 */
                    z = z->parent;
                    leftRotate(t, z);
                }                                   /* Case 3 */
                z->parent->color = BLACK;
                z->parent->parent->color = RED;
                rightRotate(t, z->parent->parent);
            }
        } else {   /* 父是右孩子：全部镜像 */
            RBNode* u = z->parent->parent->left;
            if (u->color == RED) {
                z->parent->color = BLACK;
                u->color = BLACK;
                z->parent->parent->color = RED;
                z = z->parent->parent;
            } else {
                if (z == z->parent->left) {
                    z = z->parent;
                    rightRotate(t, z);
                }
                z->parent->color = BLACK;
                z->parent->parent->color = RED;
                leftRotate(t, z->parent->parent);
            }
        }
    }
    t->root->color = BLACK;                     /* 性质 2 */
}

void rbInsert(RBTree* t, int key) {
    RBNode* z = (RBNode*)malloc(sizeof(RBNode));
    z->key = key; z->color = RED; z->left = z->right = NIL;

    RBNode* y = NIL, *x = t->root;              /* 普通 BST 插入（保留父指针） */
    while (x != NIL) {
        y = x;
        x = (key < x->key) ? x->left : x->right;
    }
    z->parent = y;
    if (y == NIL)           t->root = z;
    else if (key < y->key)  y->left  = z;
    else                    y->right = z;

    rbInsertFixup(t, z);
}

/* ---------- 删除 + 修复 ---------- */
static void rbTransplant(RBTree* t, RBNode* u, RBNode* v) {
    /* 用 v 替换 u（不管 v 是否有子树） */
    if (u->parent == NIL)      t->root = v;
    else if (u == u->parent->left)  u->parent->left  = v;
    else                            u->parent->right = v;
    v->parent = u->parent;
}

static RBNode* rbMinimum(RBNode* n) {
    while (n->left != NIL) n = n->left;
    return n;
}

static void rbDeleteFixup(RBTree* t, RBNode* x) {
    while (x != t->root && x->color == BLACK) {     /* x 携带"双黑" */
        if (x == x->parent->left) {
            RBNode* w = x->parent->right;           /* 兄弟 */
            if (w->color == RED) {                  /* Case 1 */
                w->color = BLACK;
                x->parent->color = RED;
                leftRotate(t, x->parent);
                w = x->parent->right;
            }
            if (w->left->color == BLACK && w->right->color == BLACK) {  /* Case 2 */
                w->color = RED;                     /* 兄弟代偿，双黑上移 */
                x = x->parent;
            } else {
                if (w->right->color == BLACK) {     /* Case 3：转成 Case 4 */
                    w->left->color = BLACK;
                    w->color = RED;
                    rightRotate(t, w);
                    w = x->parent->right;
                }                                   /* Case 4 */
                w->color = x->parent->color;
                x->parent->color = BLACK;
                w->right->color = BLACK;
                leftRotate(t, x->parent);
                x = t->root;                        /* 双黑消除，结束 */
            }
        } else {   /* x 是右孩子：全部镜像 */
            RBNode* w = x->parent->left;
            if (w->color == RED) {
                w->color = BLACK;
                x->parent->color = RED;
                rightRotate(t, x->parent);
                w = x->parent->left;
            }
            if (w->right->color == BLACK && w->left->color == BLACK) {
                w->color = RED;
                x = x->parent;
            } else {
                if (w->left->color == BLACK) {
                    w->right->color = BLACK;
                    w->color = RED;
                    leftRotate(t, w);
                    w = x->parent->left;
                }
                w->color = x->parent->color;
                x->parent->color = BLACK;
                w->left->color = BLACK;
                rightRotate(t, x->parent);
                x = t->root;
            }
        }
    }
    x->color = BLACK;                           /* 根或红节点补黑，双黑消失 */
}

void rbDelete(RBTree* t, RBNode* z) {
    RBNode* y = z;
    RBNode* x;
    Color yOriginalColor = y->color;
    if (z->left == NIL) {                       /* 只有右子树（含都没有） */
        x = z->right;
        rbTransplant(t, z, z->right);
    } else if (z->right == NIL) {               /* 只有左子树 */
        x = z->left;
        rbTransplant(t, z, z->left);
    } else {                                    /* 两个孩子：用后继顶替 */
        y = rbMinimum(z->right);
        yOriginalColor = y->color;
        x = y->right;
        if (y->parent == z) {
            x->parent = y;
        } else {
            rbTransplant(t, y, y->right);
            y->right = z->right;
            y->right->parent = y;
        }
        rbTransplant(t, z, y);
        y->left = z->left;
        y->left->parent = y;
        y->color = z->color;                    /* 颜色随位置转移 */
    }
    free(z);
    if (yOriginalColor == BLACK)                /* 摘除的是黑节点才需要修复 */
        rbDeleteFixup(t, x);
}

/* ---------- 中序遍历（跳过 NIL） ---------- */
void inorderRB(RBNode* root) {
    if (root == NIL) return;
    inorderRB(root->left);
    printf("%d ", root->key);
    inorderRB(root->right);
}
```

> [!note] 实现要点
> - 哨兵 NIL 让所有"空孩子"逻辑统一：不需要写 `if (child)` 判空，`NIL->color` 恒为黑。唯一注意点：**不要 free NIL**，`rbDelete` 中只 free 实际节点 z。
> - 删除的真正摘除对象 y 至多一个孩子；只有当 y 原本是黑色时才触发 fixup，且修复从 y 位置的代表节点 x 开始。
> - 哨兵 NIL 在本实现中永远不会被染红：进入 fixup 时 x 所在子树必有真兄弟（黑高约束），不会出现 w == NIL 的分支。

---

## 6. 三种树的对比总结

| 维度 | AVL 树 | Splay 树 | 红黑树 |
|---|---|---|---|
| 平衡元数据 | 高度或平衡因子 | 不存额外平衡元数据 | 颜色，理论上 1 bit |
| 核心不变式 | 每个结点 $\lvert\operatorname{bf}\rvert\le1$ | 只保持 BST；访问后伸展 | 根/NIL 黑、无红红、黑高一致 |
| 树高 | 始终 $O(\log n)$，上界较紧 | 某时刻可为 $\Theta(n)$ | $h\le2\log_2(n+1)$ |
| 查找 | 最坏 $O(\log n)$ | 摊还 $O(\log n)$，单次最坏 $O(n)$ | 最坏 $O(\log n)$ |
| 插入 | 最坏 $O(\log n)$，至多 2 次基本旋转 | 摊还 $O(\log n)$ | 最坏 $O(\log n)$，至多 2 次基本旋转 |
| 删除 | 最坏 $O(\log n)$，至多 $O(\log n)$ 次基本旋转 | 摊还 $O(\log n)$ | 最坏 $O(\log n)$，至多 3 次基本旋转 |
| 访问局部性 | 不针对近期访问调整 | 近期访问结点会被提到根附近 | 不针对近期访问调整 |
| 选择倾向 | 读多写少时可从较紧高度界受益 | 希望自调整且能容忍单次慢操作 | 更新时旋转上界小，常用于有序容器 |

这些复杂度不是实际性能的绝对排名。父指针、结点分配、对象对齐、缓存和具体负载都会影响常数；AVL 高度也不一定要用一个 `int` 存储，红黑颜色的 1 bit 同样可能被对象对齐放大。

---

## 7. 我的理解与思考

> [!note] 个人归纳声明
> 本节是我根据讲义定义、证明和手算过程整理的个人理解，不是讲义原句，也不代表额外考试结论。遇到课程特定口径时，以课堂和指定讲义为准。

### 7.1 三种树是在保证“不同的确定性”

我把 AVL 与红黑树归为**状态不变式驱动**：无论之前操作序列是什么，当前树都必须满足某些约束，因此下一次操作的最坏成本可预测。Splay 则更像**历史成本驱动**：当前状态可以很差，但昂贵操作会改变势能，使整串操作不能每次都同样昂贵。

所以我看到“平衡树”时不会直接问“哪棵最平衡”，而会先问需要哪种保证：单次最坏上界、旋转次数上界，还是操作序列的摊还上界。这个问题比背“谁查询最快”更接近三种结构的本质差异。

### 7.2 旋转是局部重写，真正的证明在不变式

三种树都复用同一组指针旋转，但旋转本身并不知道怎样恢复平衡。AVL 的证明围绕子树高度，红黑树围绕黑高与颜色，Splay 围绕子树大小秩和势能。

尤其 Splay 的 zig-zig 顺序让我看到：即使两种旋转都把目标提高两层、都保持中序序列，也可能有不同的长期成本。也就是说，“局部结果相同”不意味着“全局状态相同”。做手算题时，我应画出完整子树去向，而不只检查目标是否到了根。

### 7.3 势能不是实际运行时间，也不是凭空消失的代价

我理解势能法的重点是改变记账方式：真实成本 $c_i$ 仍由程序付出，$\Phi$ 只是证明工具。便宜操作增加势能，相当于为后续昂贵操作预留额度；昂贵操作若伴随势能下降，就能把当时的成本与过去的“存款”一起计算。

这也提醒我检查初态与末态。只写每步 $\widehat c_i$ 而不处理 $\Phi(D_0)-\Phi(D_m)$，总成本证明并不完整。Splay 的非空初态项和二进制计数器的初始位数项，都是同一个问题的不同表现。

### 7.4 红黑树的删除难在“位置少了一个黑”

插入红结点通常只制造红红冲突，删除黑结点却直接改变一侧黑色计数，所以我认为了解“黑高缺口”比孤立背四个 Case 更重要。兄弟能提供红侄子时，可以局部旋转并补色；不能提供时，只能把额外黑色向父亲推。

2-3-4 树对应则提供另一种检查方式：染色与旋转之后，把黑结点及其红孩子重新合并，看看得到的多路结点是否仍合法。这个视角是我的辅助检查方法，不能替代逐条验证五个性质。

---

## 8. 考点速查

1. **高度口径**：讲义边高为空树 -1、叶子 0；代码常用空树 0、叶子 1。代公式前先统一。
2. **AVL 高度**：$N(h)=1+N(h-1)+N(h-2)$；$N(4)=12,N(5)=20$。平衡条件必须对每个结点成立。
3. **AVL 插入**：修复最低失衡结点；LL/RR 单旋，LR/RL 双旋；至多 2 次基本旋转。
4. **AVL 删除**：按较高孩子的平衡因子分类；`bf = 0` 归入同向单旋；修复后可能继续向上，至多 $O(\log n)$ 次旋转。
5. **旋转不变量**：中序不变；中间子树必须接回；AVL 先更新旧根再更新新根。
6. **Splay 三类步骤**：zig 至多一次且在末尾；zig-zag 是折线；zig-zig 同向且先祖父后父亲。
7. **Splay 失败查找**：也要伸展最后访问的非空结点，否则可重复走一条长链而破坏对数摊还保证。
8. **势能公式**：$\widehat c=c+\Delta\Phi$；$r(v)=\log s(v)$，$\Phi=\sum r(v)$；访问引理伸缩相消得 $1+3\log n$。
9. **摊还不是平均**：Splay 单次可 $\Theta(n)$；非空初态要保留初始势能项。
10. **红黑黑高**：不含起点、包含 NIL，$\operatorname{bh}(NIL)=0$；$n\ge2^{bh(root)}-1$，故 $h\le2\log(n+1)$。
11. **红黑插入**：新结点先染红；看叔叔，叔叔红则改色上推，叔叔黑则旋转；至多 2 次旋转。
12. **红黑删除**：看真正摘除结点 $y$ 的原颜色；双黑修复看兄弟与近/远侄子；至多 3 次旋转。
13. **手算自检**：BST 中序有序；AVL 每结点 $|\operatorname{bf}|\le1$；红黑根黑、无红红、各 NIL 路径黑数相同。
14. **比较题**：不要把高度界或旋转次数直接写成实际性能排名，应说明保证类型与实现条件。

---

## 9. 参考

- 课程讲义：[[讲义/lec01_AVL树-Splay树-摊还分析.pdf|lec01 AVL 树、Splay 树与摊还分析]]。
- 课程讲义：[[讲义/lec02_红黑树-B+树.pdf|lec02 红黑树与 B+ 树]]。
- CLRS《算法导论》第 13 章（红黑树）、第 17 章（摊还分析）；B 树对照见第 18 章。
- Sleator, D. D., & Tarjan, R. E. (1985). *Self-Adjusting Binary Search Trees*. JACM 32(3), 652–686。访问引理与加权势能分析见该文。
