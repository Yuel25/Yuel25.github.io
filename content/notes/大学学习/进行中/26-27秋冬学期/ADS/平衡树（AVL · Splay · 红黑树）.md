---
title: 平衡树（AVL · Splay · 红黑树）
tags:
  - 课程/ADS
---

# 平衡树（AVL · Splay · 红黑树）

> [!abstract] 导览
> 本文系统讲解三种经典平衡二叉搜索树：**AVL 树**、**伸展树（Splay Tree）** 和**红黑树（Red-Black Tree）**。所有代码均为可编译的完整 C 实现。
>
> - [[#1. 为什么需要平衡树]] —— 问题动机
> - [[#2. 旋转：一切平衡操作的基础]] —— 左旋 / 右旋
> - [[#3. AVL 树]] —— 高度严格平衡
> - [[#4. Splay 树（伸展树）]] —— 摊还意义下平衡
> - [[#5. 红黑树]] —— 工程上最常用的平衡树
> - [[#6. 三种树的对比总结]] —— 考点速查表

---

## 1. 为什么需要平衡树

普通二叉搜索树（BST）的查找、插入、删除代价都是 **O(h)**（h 为树高）。理想情况下 $h = \lfloor \log_2 n \rfloor$，但如果插入序列有序（如 1, 2, 3, ..., n），树会退化成一条链，$h = n$，所有操作退化为 O(n)。

**平衡树的核心思想**：在插入 / 删除后，通过局部的结构调整（旋转），把树高压在 O(log n) 以内。

三种树的“平衡策略”截然不同：

| 树 | 平衡手段 | 平衡程度 |
|---|---|---|
| AVL | 硬性约束任意节点左右子树**高度差 ≤ 1** | 最严格，查询最快 |
| Splay | 不维护任何平衡信息，每次访问把节点**伸展到根**，利用局部性 | 单次可能 O(n)，**摊还** O(log n) |
| 红黑树 | 用**颜色标记**保证"任意路径黑节点数相同"，放松高度约束 | 介于两者之间，**插入 / 删除最快** |

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

> [!tip] 记忆口诀
> 左旋 = 把**右孩子**提上来，右旋 = 把**左孩子**提上来。旋转方向与"提上来的孩子所在的一侧"一致。
> 注意被挤掉的子树（B）要**接回去**，且旋转后必须更新沿途节点维护的信息（如 AVL 的高度、红黑树无需更新）。

---

## 3. AVL 树

> 1962 年由 Adelson-Velsky 和 Landis 提出，是最早的自平衡 BST。

### 3.1 定义与性质

- 每个节点额外存储**高度** `height`（空树高度为 0，叶节点高度为 1）。
- **平衡因子** `bf(node) = height(左子树) − height(右子树)`。
- 平衡条件：**任意节点的 |bf| ≤ 1**。
- 设 $n(h)$ 为高度 h 的 AVL 树最少节点数，则 $n(h) = n(h-1) + n(h-2) + 1$（斐波那契递推），从而：

$$h \le 1.4405\,\log_2(n+2) - 0.3277$$

即 AVL 树的高度只比最优的 $\log_2 n$ 多约 44%，**查询性能是所有平衡树中最好的**。

### 3.2 四种失衡与修复

插入 / 删除导致某节点 |bf| = 2 时，依据"失衡节点 → 孙子节点"的路径形状分四种情况：

#### LL（左左）：右旋一次

```text
       z (bf=+2)                y
      /                       /   \
     y (bf=+1)      ====>    x     z
    / \                     /     / \
   x   B                   A     B   C
  / \
 A   B
```

修复：`rotateRight(z)`。

#### RR（右右）：左旋一次

修复：`rotateLeft(z)`，与 LL 完全镜像。

#### LR（左右）：先左旋后右旋

```text
     z (bf=+2)                z               x
    /                        /              /   \
   y (bf=−1)      ====>     x      ====>   y     z
  / \                      / \            /     / \
 A   x                    y   C          A     B   C
    / \                  / \
   B   C                A   B
```

修复：`y = rotateLeft(y)`，然后 `rotateRight(z)`。子树 B、C 两次被移交。

#### RL（右左）：先右旋后左旋

修复：`z->right = rotateRight(z->right)`，然后 `rotateLeft(z)`，LR 的镜像。

> [!important] 关键区别：插入 vs 删除
> - **插入**：失衡由新节点引起，一次旋转后**整棵树恢复平衡**，停止向上检查。
> - **删除**：失衡节点的子树高度可能真的减少了，修复后**必须继续向上检查祖先**（失衡可能传播到根部），最多需要 O(log n) 次旋转（实际统计平均不到 2 次）。

插入时的判定用**插入键值**与失衡节点孩子的比较；删除时子树形状已不确定，必须用**平衡因子的符号**判定（见代码）。

### 3.3 AVL 完整 C 实现

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
> - 删除时不用"插入键值"而用**子树的平衡因子符号**判断，因为删除后孙子节点的结构可能任意。
> - `b > 1 && bf(root->left) >= 0` 中 `>=` 与 `<` 的分界：左孩子 bf = 0 时算 LL（右旋即可，双旋也等价，但单旋更省）。
> - 单旋情况下把整棵子树根指针换掉即可，无需父指针——这是"递归 + 返回新根"写法的优点。

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

> [!important] 与"每次只旋一步"的区别
> zig-zig 必须**先旋祖父层、再旋父层**（自底向上的"双层旋转"），才能保证摊还 O(log n)。若每步都直接旋到根，会被退化的访问序列卡成 O(n) 每次。这是 Splay 树最经典的考点。

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
  4. 返回 n 为根。`split`（把树按 key 分裂成 ≤key 和 >key 两棵）本质就是插入的第 3 步。
- **删除**：
  1. `root = splay(root, key)`，不存在则返回；
  2. 此时 root 无父节点，左右子树 L、R 独立：摘下并释放 root；
  3. 若 L 非空：`L = splay(L, key)`（key 不在 L 中，会把 **L 中最大元**提到 L 的根，且其右子树必空），令 `L->right = R`，返回 L；否则返回 R。`join(L, R)`（合并两棵所有键 < 所有键的树）同理。

### 4.3 摊还复杂度

定义势函数 $\Phi = \sum_{x} rank(x)$，其中 $rank(x) = \log_2(\text{以 } x \text{ 为根的子树节点数})$。可以证明（Sleator–Tarjan 定理）：

$$\text{zig-zig / zig-zag 步的摊还代价} \le 3\big(rank_{new}(x) - rank_{old}(x)\big), \quad \text{zig 步} \le 3\big(rank_{new}(x) - rank_{old}(x)\big) + 1$$

伸缩相消（telescoping）后，**一次 splay 的摊还代价 ≤ 3 log₂n + 1 = O(log n)**；任意 m 次操作的序列（从空树开始、总节点数 n）总代价 O(m log n + n)。直觉：zig-zig / zig-zag 每执行一次，x 的子树规模近似翻倍（rank 至少 +1，势能增加足以"支付"这次旋转），而每步实际代价只有 O(1)，O(log n) 次"翻倍"就到根了。

> [!warning] 单次操作可能很慢
> 一次 splay 最坏 O(n)（例如把最深的叶子提到根），就像快速排序单次划分最坏 O(n) 但平均 O(log n)。若题目强调"单次最坏"，Splay 不如 AVL / 红黑树；强调"任意长操作序列的总代价"，三者同为 O(m log n)。

### 4.4 Splay 完整 C 实现（递归版）

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

### 5.1 五条性质

1. 每个节点是**红色或黑色**；
2. **根是黑色**；
3. 每个**叶节点（NIL 空指针）是黑色**；
4. **红节点的两个子节点都是黑色**（即不能有两个连续的红节点，简称"无红红"）；
5. **任意节点到其所有后代叶节点（NIL）的路径上，黑节点个数相同**（黑高 black-height 相等）。

**结论**：由性质 4、5，一条路径上红节点不超过黑节点，故**最短路径 ≥ 最长路径的一半**，即

$$h \le 2\log_2(n+1)$$

### 5.2 设计哲学

与 AVL 追求"高度严格相等"不同，红黑树只要求"大致平衡"。它本质是一棵 **2-3-4 树（阶为 4 的 B 树）** 的二叉表示：把 3-节点画成"红父黑子"、4-节点画成"黑父两红子"。这样理解能解释所有修复规则——红黑树的调整等价于 B 树节点的分裂与借位。

### 5.3 插入修复

新节点 z 染**红色**插入（不增加任何路径的黑高，所以只会违反性质 2 或 4）。若父节点是黑色则结束；父节点为红时按**叔叔节点 u** 的颜色分三种情况（设父节点为左孩子）：

```text
Case 1（叔叔红）：改色，把冲突上推两层
      g(黑)                g(红) ← 继续检查 g
     /     \              /     \
  p(红)   u(红)  ====>  p(黑)   u(黑)
   /                    /
  z(红)                z(红)

Case 2（叔叔黑，z 是右孩子）：先左旋父节点，转化为 Case 3
      g                 g
     /                 /
   p(红)    ====>     z(红)
     \               /
      z            p(红)

Case 3（叔叔黑，z 是左孩子）：改色 + 右旋祖父，结束
      g(红)              p(黑)
     /     \            /     \
  p(红)   D   ====>   z(红)   g(红)
   / \                 \      / \
  z   C                 A    C   D
```

- Case 1 执行后 z 上移到祖父，可能继续违反性质 4，循环；
- Case 3 完成后局部根为黑色，性质 4 恢复，循环必然终止；最后把根强制染黑。

**插入最多 2 次旋转**（Case 2 + Case 3 各一次），最多 O(log n) 次改色。

### 5.4 删除修复

BST 删除中，真正摘除的节点 y 至多只有一个孩子：

- y 是**红色** → 直接删除，所有性质保持（红节点不在任何黑高路径上计数）；
- y 是**黑色** → 删除后 y 原位置的代表节点 x"少了一个黑节点"，产生**双黑（doubly black）**，需要通过兄弟节点 w 把黑色补回来。

修复循环（x 不是根且 x 为黑色时继续，设 x 是左孩子）：

```text
Case 1（兄弟 w 红）：w 染黑、父染红、左旋父，转为 Case 2/3/4
Case 2（w 黑，w 的两孩子全黑）：w 染红、双黑上移给父节点，循环
Case 3（w 黑，w 的左孩子红、右孩子黑）：w 左孩子染黑、w 染红、右旋 w，转为 Case 4
Case 4（w 黑，w 的右孩子红）：w 染成父的颜色、父染黑、w 右孩子染黑、左旋父，结束
```

- Case 1 是一次旋转 + 两次改色，之后必然落入 2/3/4，故 **Case 1 与 2/3/4 合计至多 3 次旋转**；
- Case 2 可能循环 O(log n) 次，但每次只做改色；
- 直觉：Case 2 让父节点"代收"双黑；若父节点是红色则下一轮循环直接退出并染黑，恰好补回。

> [!tip] 对称情况
> 以上全部是"x 是父的左孩子"的版本。x 为右孩子时完全镜像：左右互换、左旋↔右旋。写代码时用 `if (x == x->parent->left) { ... } else { 镜像 ... }`。

### 5.5 红黑树完整 C 实现

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
| 平衡信息 | 每个节点存**高度** | **不存**任何信息 | 每个节点存**颜色**（1 bit） |
| 平衡条件 | 任意节点 \|左右高度差\| ≤ 1 | 无（靠 splay 自适应） | 黑高相等 + 无红红 |
| 高度上界 | h ≤ 1.44 log₂(n+2) | 摊还 O(log n) | h ≤ 2 log₂(n+1) |
| 查找 | **O(log n)，最快** | O(log n) 摊还，单次最坏 O(n) | O(log n) |
| 插入 | O(log n)，**至多 2 次旋转** | O(log n) 摊还 | O(log n)，**至多 2 次旋转** |
| 删除 | O(log n)，至多 O(log n) 次旋转（实际 ≈1 次） | O(log n) 摊还 | O(log n)，**至多 3 次旋转** |
| 内存开销 | 每个节点 int（高度） | 零开销 | 每个节点 1 bit（或 1 字节） |
| 顺序访问 / 局部性 | 无特殊优化 | **极强**（刚访问的很快再访问时接近 O(1)） | 无特殊优化 |
| 典型应用 | 读多写少的静态索引 | 缓存、网络路由、编译器符号表 | STL map/set、Linux 内核、Java TreeMap |

### 考试要点速记

1. **旋转**任何平衡树的第一步，先写对左旋/右旋再谈修复；旋转不改变中序序列。
2. **AVL 插入 vs 删除**：插入修一次即停（判据：插入键值）；删除需一路向上（判据：平衡因子符号）。删除判据用 `bf(子树) >= 0 / < 0` 而不是键值比较。
3. **Splay 的 zig-zig 顺序**：先祖父后父亲；否则摊还界失效。
4. **Splay 全部操作 = splay + 分裂/合并**，记住 `split` / `join` 的原语推导。
5. **红黑树插入**看**叔叔**、**删除**看**兄弟**；插入新节点必为红，根必为黑。
6. 旋转次数上界：AVL 插入 ≤ 2；红黑树插入 ≤ 2、删除 ≤ 3（Case 1 只轮转一次）——这是"为什么工业界选红黑树"的标准答案。
7. 手算画树题：给插入序列画三种树的演化，注意红黑树先按 BST 插入、再自下而上修复、最后根染黑。

### 参考

- CLRS《算法导论》第 13 章（红黑树）、第 14 章（扩张的数据结构，含动态树的摊还思想）
- Sleator, D. D., & Tarjan, R. E. (1985). *Self-Adjusting Binary Search Trees*. JACM 32(3), 652–686.
