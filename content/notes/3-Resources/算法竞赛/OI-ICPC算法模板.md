---
title: OI/ICPC 算法模板
date: 2026-07-05
tags:
  - 算法竞赛
  - ICPC
  - OI
  - 模板
source:
  - https://github.com/OI-wiki/OI-wiki
  - https://oi-wiki.org/
---

# OI/ICPC 算法模板

根据 [OI-wiki/OI-wiki](https://github.com/OI-wiki/OI-wiki) 的知识结构整理。代码为自用短模板，比赛前务必自己敲一遍。

## 0. 通用

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;
using pii = pair<int,int>;
const int INF = 0x3f3f3f3f;
const ll LINF = (1LL << 62);

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  return 0;
}
```

```cpp
template<class T> bool chmin(T& a, const T& b) { return b < a ? a = b, true : false; }
template<class T> bool chmax(T& a, const T& b) { return a < b ? a = b, true : false; }
```

## 1. 数学

### 快速幂 / 逆元

```cpp
ll qpow(ll a, ll b, ll mod) {
  ll r = 1 % mod;
  for (a %= mod; b; b >>= 1, a = a * a % mod)
    if (b & 1) r = r * a % mod;
  return r;
}

ll inv_prime(ll a, ll mod) { return qpow(a, mod - 2, mod); }
```

### exgcd / 线性同余

```cpp
ll exgcd(ll a, ll b, ll& x, ll& y) {
  if (!b) return x = 1, y = 0, a;
  ll x1, y1, g = exgcd(b, a % b, x1, y1);
  x = y1;
  y = x1 - a / b * y1;
  return g;
}

// ax = b (mod m), 返回最小非负解；无解返回 -1
ll linear_congruence(ll a, ll b, ll m) {
  ll x, y, g = exgcd(a, m, x, y);
  if (b % g) return -1;
  ll mod = m / g;
  return (x * (b / g) % mod + mod) % mod;
}
```

### CRT

```cpp
// x = r[i] (mod m[i])，m 可不互质；无解返回 {0,-1}
pair<ll,ll> crt(const vector<ll>& r, const vector<ll>& m) {
  ll R = 0, M = 1;
  for (int i = 0; i < (int)r.size(); ++i) {
    ll x, y, g = exgcd(M, m[i], x, y);
    if ((r[i] - R) % g) return {0, -1};
    ll t = ((r[i] - R) / g % (m[i] / g) * x) % (m[i] / g);
    R += M * t;
    M = M / g * m[i];
    R = (R % M + M) % M;
  }
  return {R, M};
}
```

### 线性筛

```cpp
vector<int> primes, lp;
void sieve(int n) {
  lp.assign(n + 1, 0);
  for (int i = 2; i <= n; ++i) {
    if (!lp[i]) lp[i] = i, primes.push_back(i);
    for (int p : primes) {
      if (p > lp[i] || 1LL * i * p > n) break;
      lp[i * p] = p;
    }
  }
}
```

### 莫比乌斯函数 / 反演

$$
F(n)=\sum_{d|n} f(d)\quad\Longleftrightarrow\quad f(n)=\sum_{d|n}\mu(d)F(n/d)
$$

```cpp
vector<int> mu, primes;
vector<char> is_comp;
vector<ll> smu;

void mobius_sieve(int n) {
  mu.assign(n + 1, 0);
  is_comp.assign(n + 1, 0);
  smu.assign(n + 1, 0);
  primes.clear();
  mu[1] = 1;
  for (int i = 2; i <= n; ++i) {
    if (!is_comp[i]) primes.push_back(i), mu[i] = -1;
    for (int p : primes) {
      if (1LL * i * p > n) break;
      is_comp[i * p] = 1;
      if (i % p == 0) { mu[i * p] = 0; break; }
      mu[i * p] = -mu[i];
    }
  }
  for (int i = 1; i <= n; ++i) smu[i] = smu[i - 1] + mu[i];
}

// 例：sum_{i=1..n} sum_{j=1..m} [gcd(i,j)==1]
ll coprime_pairs(int n, int m) {
  if (n > m) swap(n, m);
  ll ans = 0;
  for (int l = 1, r; l <= n; l = r + 1) {
    r = min(n / (n / l), m / (m / l));
    ans += (smu[r] - smu[l - 1]) * (n / l) * (m / l);
  }
  return ans;
}
```

### 组合数

```cpp
const int MOD = 1000000007;
vector<ll> fac, ifac;
void init_comb(int n) {
  fac.assign(n + 1, 1);
  ifac.assign(n + 1, 1);
  for (int i = 1; i <= n; ++i) fac[i] = fac[i - 1] * i % MOD;
  ifac[n] = qpow(fac[n], MOD - 2, MOD);
  for (int i = n; i; --i) ifac[i - 1] = ifac[i] * i % MOD;
}
ll C(int n, int k) {
  if (k < 0 || k > n) return 0;
  return fac[n] * ifac[k] % MOD * ifac[n - k] % MOD;
}
```

### 矩阵快速幂

```cpp
using Mat = vector<vector<ll>>;
Mat mul(const Mat& a, const Mat& b, ll mod) {
  int n = a.size(), m = b[0].size(), k = b.size();
  Mat c(n, vector<ll>(m));
  for (int i = 0; i < n; ++i)
    for (int t = 0; t < k; ++t) if (a[i][t])
      for (int j = 0; j < m; ++j)
        c[i][j] = (c[i][j] + a[i][t] * b[t][j]) % mod;
  return c;
}
Mat mpow(Mat a, ll e, ll mod) {
  int n = a.size();
  Mat r(n, vector<ll>(n));
  for (int i = 0; i < n; ++i) r[i][i] = 1;
  for (; e; e >>= 1, a = mul(a, a, mod))
    if (e & 1) r = mul(r, a, mod);
  return r;
}
```

## 2. 数据结构

### 并查集

```cpp
struct DSU {
  vector<int> p, sz;
  DSU(int n = 0) { init(n); }
  void init(int n) {
    p.resize(n + 1);
    sz.assign(n + 1, 1);
    iota(p.begin(), p.end(), 0);
  }
  int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
  bool unite(int a, int b) {
    a = find(a), b = find(b);
    if (a == b) return false;
    if (sz[a] < sz[b]) swap(a, b);
    p[b] = a, sz[a] += sz[b];
    return true;
  }
};
```

### 树状数组

```cpp
struct BIT {
  int n;
  vector<ll> t;
  BIT(int n = 0) { init(n); }
  void init(int n_) { n = n_; t.assign(n + 1, 0); }
  void add(int x, ll v) { for (; x <= n; x += x & -x) t[x] += v; }
  ll sum(int x) {
    ll r = 0;
    for (; x; x -= x & -x) r += t[x];
    return r;
  }
  ll range(int l, int r) { return sum(r) - sum(l - 1); }
};
```

### 线段树：区间加 / 区间和

```cpp
struct Seg {
  int n;
  vector<ll> sum, tag;
  Seg(int n = 0) { init(n); }
  void init(int n_) { n = n_; sum.assign(4*n+4,0); tag.assign(4*n+4,0); }
  void apply(int p, int l, int r, ll v) { sum[p] += v * (r - l + 1); tag[p] += v; }
  void push(int p, int l, int r) {
    if (!tag[p] || l == r) return;
    int m = (l + r) >> 1;
    apply(p<<1, l, m, tag[p]);
    apply(p<<1|1, m+1, r, tag[p]);
    tag[p] = 0;
  }
  void add(int p, int l, int r, int ql, int qr, ll v) {
    if (ql <= l && r <= qr) return apply(p, l, r, v);
    push(p, l, r);
    int m = (l + r) >> 1;
    if (ql <= m) add(p<<1, l, m, ql, qr, v);
    if (m < qr) add(p<<1|1, m+1, r, ql, qr, v);
    sum[p] = sum[p<<1] + sum[p<<1|1];
  }
  ll query(int p, int l, int r, int ql, int qr) {
    if (ql <= l && r <= qr) return sum[p];
    push(p, l, r);
    int m = (l + r) >> 1;
    ll ans = 0;
    if (ql <= m) ans += query(p<<1, l, m, ql, qr);
    if (m < qr) ans += query(p<<1|1, m+1, r, ql, qr);
    return ans;
  }
};
```

### ST 表 RMQ

```cpp
struct ST {
  vector<vector<int>> st;
  vector<int> lg;
  void build(const vector<int>& a) {
    int n = (int)a.size() - 1;
    lg.assign(n + 1, 0);
    for (int i = 2; i <= n; ++i) lg[i] = lg[i >> 1] + 1;
    st.assign(lg[n] + 1, vector<int>(n + 1));
    st[0] = a;
    for (int k = 1; k <= lg[n]; ++k)
      for (int i = 1; i + (1 << k) - 1 <= n; ++i)
        st[k][i] = min(st[k-1][i], st[k-1][i + (1 << (k-1))]);
  }
  int query(int l, int r) {
    int k = lg[r - l + 1];
    return min(st[k][l], st[k][r - (1 << k) + 1]);
  }
};
```

## 3. 图论

### Dijkstra

```cpp
vector<ll> dijkstra(int n, int s, vector<vector<pair<int,int>>>& g) {
  vector<ll> d(n + 1, LINF);
  priority_queue<pair<ll,int>, vector<pair<ll,int>>, greater<pair<ll,int>>> q;
  d[s] = 0; q.push({0, s});
  while (!q.empty()) {
    auto [du, u] = q.top(); q.pop();
    if (du != d[u]) continue;
    for (auto [v, w] : g[u])
      if (d[v] > du + w) d[v] = du + w, q.push({d[v], v});
  }
  return d;
}
```

### Kruskal

```cpp
struct Edge { int u, v; ll w; };
ll kruskal(int n, vector<Edge> e) {
  sort(e.begin(), e.end(), [](auto a, auto b){ return a.w < b.w; });
  DSU dsu(n);
  ll ans = 0; int cnt = 0;
  for (auto [u, v, w] : e)
    if (dsu.unite(u, v)) ans += w, ++cnt;
  return cnt == n - 1 ? ans : -1;
}
```

### 拓扑排序

```cpp
vector<int> topo(int n, vector<vector<int>>& g) {
  vector<int> in(n + 1), ans;
  for (int u = 1; u <= n; ++u) for (int v : g[u]) ++in[v];
  queue<int> q;
  for (int i = 1; i <= n; ++i) if (!in[i]) q.push(i);
  while (!q.empty()) {
    int u = q.front(); q.pop(); ans.push_back(u);
    for (int v : g[u]) if (--in[v] == 0) q.push(v);
  }
  return ans; // size < n 表示有环
}
```

### LCA 倍增

```cpp
struct LCA {
  int n, LOG;
  vector<int> dep;
  vector<vector<int>> up, g;
  LCA(int n = 0) { init(n); }
  void init(int n_) {
    n = n_; LOG = 1;
    while ((1 << LOG) <= n) ++LOG;
    dep.assign(n + 1, 0);
    up.assign(LOG, vector<int>(n + 1));
    g.assign(n + 1, {});
  }
  void add(int u, int v) { g[u].push_back(v); g[v].push_back(u); }
  void dfs(int u, int p) {
    up[0][u] = p;
    for (int k = 1; k < LOG; ++k) up[k][u] = up[k-1][up[k-1][u]];
    for (int v : g[u]) if (v != p) dep[v] = dep[u] + 1, dfs(v, u);
  }
  int ask(int a, int b) {
    if (dep[a] < dep[b]) swap(a, b);
    int d = dep[a] - dep[b];
    for (int k = 0; k < LOG; ++k) if (d >> k & 1) a = up[k][a];
    if (a == b) return a;
    for (int k = LOG - 1; k >= 0; --k)
      if (up[k][a] != up[k][b]) a = up[k][a], b = up[k][b];
    return up[0][a];
  }
};
```

### Tarjan SCC

```cpp
struct SCC {
  int n, tim = 0, cnt = 0;
  vector<vector<int>> g;
  vector<int> dfn, low, st, bel;
  vector<char> ins;
  SCC(int n = 0): n(n), g(n+1), dfn(n+1), low(n+1), bel(n+1), ins(n+1) {}
  void add(int u, int v) { g[u].push_back(v); }
  void dfs(int u) {
    dfn[u] = low[u] = ++tim; st.push_back(u); ins[u] = 1;
    for (int v : g[u]) {
      if (!dfn[v]) dfs(v), low[u] = min(low[u], low[v]);
      else if (ins[v]) low[u] = min(low[u], dfn[v]);
    }
    if (dfn[u] == low[u]) {
      ++cnt;
      while (true) {
        int x = st.back(); st.pop_back(); ins[x] = 0; bel[x] = cnt;
        if (x == u) break;
      }
    }
  }
  void run() { for (int i = 1; i <= n; ++i) if (!dfn[i]) dfs(i); }
};
```

### Dinic 最大流

```cpp
struct Dinic {
  struct E { int to, rev; ll cap; };
  int n;
  vector<vector<E>> g;
  vector<int> dep, it;
  Dinic(int n = 0): n(n), g(n+1), dep(n+1), it(n+1) {}
  void add(int u, int v, ll c) {
    E a{v, (int)g[v].size(), c}, b{u, (int)g[u].size(), 0};
    g[u].push_back(a); g[v].push_back(b);
  }
  bool bfs(int s, int t) {
    fill(dep.begin(), dep.end(), -1);
    queue<int> q; dep[s] = 0; q.push(s);
    while (!q.empty()) {
      int u = q.front(); q.pop();
      for (auto& e : g[u]) if (e.cap && dep[e.to] < 0)
        dep[e.to] = dep[u] + 1, q.push(e.to);
    }
    return dep[t] >= 0;
  }
  ll dfs(int u, int t, ll f) {
    if (u == t) return f;
    for (int& i = it[u]; i < (int)g[u].size(); ++i) {
      E& e = g[u][i];
      if (e.cap && dep[e.to] == dep[u] + 1) {
        ll ret = dfs(e.to, t, min(f, e.cap));
        if (ret) { e.cap -= ret; g[e.to][e.rev].cap += ret; return ret; }
      }
    }
    return 0;
  }
  ll flow(int s, int t) {
    ll ans = 0, f;
    while (bfs(s, t)) {
      fill(it.begin(), it.end(), 0);
      while ((f = dfs(s, t, LINF))) ans += f;
    }
    return ans;
  }
};
```

## 4. 字符串

### KMP

```cpp
vector<int> prefix_function(const string& s) {
  int n = s.size();
  vector<int> pi(n);
  for (int i = 1; i < n; ++i) {
    int j = pi[i - 1];
    while (j && s[i] != s[j]) j = pi[j - 1];
    if (s[i] == s[j]) ++j;
    pi[i] = j;
  }
  return pi;
}
```

### Z 函数

```cpp
vector<int> z_function(const string& s) {
  int n = s.size();
  vector<int> z(n);
  for (int i = 1, l = 0, r = 0; i < n; ++i) {
    if (i <= r) z[i] = min(r - i + 1, z[i - l]);
    while (i + z[i] < n && s[z[i]] == s[i + z[i]]) ++z[i];
    if (i + z[i] - 1 > r) l = i, r = i + z[i] - 1;
  }
  return z;
}
```

### Trie

```cpp
struct Trie {
  struct Node { int ch[26] = {}, end = 0; };
  vector<Node> t{{}};
  void insert(const string& s) {
    int u = 0;
    for (char c : s) {
      int x = c - 'a';
      if (!t[u].ch[x]) t[u].ch[x] = t.size(), t.push_back({});
      u = t[u].ch[x];
    }
    ++t[u].end;
  }
};
```

### Manacher

```cpp
vector<int> manacher(string s) {
  string t = "#";
  for (char c : s) t += c, t += '#';
  int n = t.size(), c = 0, r = 0;
  vector<int> p(n);
  for (int i = 0; i < n; ++i) {
    if (i < r) p[i] = min(r - i, p[2*c - i]);
    while (i-p[i]-1 >= 0 && i+p[i]+1 < n && t[i-p[i]-1] == t[i+p[i]+1]) ++p[i];
    if (i + p[i] > r) c = i, r = i + p[i];
  }
  return p;
}
```

## 5. 搜索与 DP 常用写法

### 01 背包

```cpp
vector<ll> dp(W + 1, -LINF);
dp[0] = 0;
for (auto [w, v] : items)
  for (int j = W; j >= w; --j)
    dp[j] = max(dp[j], dp[j - w] + v);
```

### 完全背包

```cpp
vector<ll> dp(W + 1, -LINF);
dp[0] = 0;
for (auto [w, v] : items)
  for (int j = w; j <= W; ++j)
    dp[j] = max(dp[j], dp[j - w] + v);
```

### 二分答案

```cpp
ll l = 0, r = 1e18;
while (l < r) {
  ll m = (l + r) >> 1;
  if (check(m)) r = m;
  else l = m + 1;
}
```

### 离散化

```cpp
vector<int> xs = a;
sort(xs.begin(), xs.end());
xs.erase(unique(xs.begin(), xs.end()), xs.end());
auto id = [&](int x) {
  return lower_bound(xs.begin(), xs.end(), x) - xs.begin() + 1;
};
```

## 6. 计算几何

```cpp
const double EPS = 1e-9;
int sgn(double x) { return (x > EPS) - (x < -EPS); }

struct P {
  double x, y;
  P operator + (P b) const { return {x + b.x, y + b.y}; }
  P operator - (P b) const { return {x - b.x, y - b.y}; }
  P operator * (double k) const { return {x * k, y * k}; }
};
double dot(P a, P b) { return a.x*b.x + a.y*b.y; }
double cross(P a, P b) { return a.x*b.y - a.y*b.x; }
double len(P a) { return sqrt(dot(a, a)); }
```

### 凸包

```cpp
vector<P> convex_hull(vector<P> p) {
  sort(p.begin(), p.end(), [](P a, P b) {
    return a.x == b.x ? a.y < b.y : a.x < b.x;
  });
  vector<P> h;
  for (P x : p) {
    while (h.size() > 1 && cross(h.back() - h[h.size()-2], x - h.back()) <= 0) h.pop_back();
    h.push_back(x);
  }
  int lower = h.size();
  for (int i = (int)p.size() - 2; i >= 0; --i) {
    P x = p[i];
    while ((int)h.size() > lower && cross(h.back() - h[h.size()-2], x - h.back()) <= 0) h.pop_back();
    h.push_back(x);
  }
  if (!h.empty()) h.pop_back();
  return h;
}
```

## 7. 进阶常用

### AC 自动机

```cpp
struct AC {
  struct Node { int ch[26] = {}, fail = 0, cnt = 0; };
  vector<Node> t{{}};
  void insert(const string& s) {
    int u = 0;
    for (char c : s) {
      int x = c - 'a';
      if (!t[u].ch[x]) t[u].ch[x] = t.size(), t.push_back({});
      u = t[u].ch[x];
    }
    ++t[u].cnt;
  }
  void build() {
    queue<int> q;
    for (int c = 0; c < 26; ++c) if (t[0].ch[c]) q.push(t[0].ch[c]);
    while (!q.empty()) {
      int u = q.front(); q.pop();
      t[u].cnt += t[t[u].fail].cnt;
      for (int c = 0; c < 26; ++c) {
        int v = t[u].ch[c];
        if (v) t[v].fail = t[t[u].fail].ch[c], q.push(v);
        else t[u].ch[c] = t[t[u].fail].ch[c];
      }
    }
  }
  int query(const string& s) {
    int u = 0, ans = 0;
    for (char c : s) u = t[u].ch[c - 'a'], ans += t[u].cnt;
    return ans;
  }
};
```

### 后缀数组

```cpp
vector<int> suffix_array(const string& s) {
  int n = s.size();
  vector<int> sa(n), rk(n), tmp(n);
  iota(sa.begin(), sa.end(), 0);
  for (int i = 0; i < n; ++i) rk[i] = s[i];
  for (int k = 1;; k <<= 1) {
    auto cmp = [&](int a, int b) {
      if (rk[a] != rk[b]) return rk[a] < rk[b];
      int ra = a + k < n ? rk[a + k] : -1;
      int rb = b + k < n ? rk[b + k] : -1;
      return ra < rb;
    };
    sort(sa.begin(), sa.end(), cmp);
    tmp[sa[0]] = 0;
    for (int i = 1; i < n; ++i) tmp[sa[i]] = tmp[sa[i-1]] + cmp(sa[i-1], sa[i]);
    rk = tmp;
    if (rk[sa.back()] == n - 1) break;
  }
  return sa;
}

vector<int> lcp_array(const string& s, const vector<int>& sa) {
  int n = s.size(), h = 0;
  vector<int> rk(n), lcp(n - 1);
  for (int i = 0; i < n; ++i) rk[sa[i]] = i;
  for (int i = 0; i < n; ++i) {
    if (rk[i] == n - 1) { h = 0; continue; }
    int j = sa[rk[i] + 1];
    while (i + h < n && j + h < n && s[i + h] == s[j + h]) ++h;
    lcp[rk[i]] = h;
    if (h) --h;
  }
  return lcp;
}
```

### 2-SAT

```cpp
struct TwoSAT {
  int n;
  SCC scc;
  TwoSAT(int n): n(n), scc(2*n) {}
  int id(int x, bool v) { return 2 * x + v; } // x: 0..n-1
  void imply(int a, bool va, int b, bool vb) { scc.add(id(a, va), id(b, vb)); }
  void either(int a, bool va, int b, bool vb) {
    imply(a, !va, b, vb);
    imply(b, !vb, a, va);
  }
  vector<int> solve() {
    scc.run();
    vector<int> ans(n);
    for (int i = 0; i < n; ++i) {
      if (scc.bel[id(i,0)] == scc.bel[id(i,1)]) return {};
      ans[i] = scc.bel[id(i,0)] < scc.bel[id(i,1)];
    }
    return ans;
  }
};
```

### 费用流

```cpp
struct MCMF {
  struct E { int to, rev; ll cap, cost; };
  int n;
  vector<vector<E>> g;
  MCMF(int n = 0): n(n), g(n + 1) {}
  void add(int u, int v, ll cap, ll cost) {
    E a{v, (int)g[v].size(), cap, cost};
    E b{u, (int)g[u].size(), 0, -cost};
    g[u].push_back(a); g[v].push_back(b);
  }
  pair<ll,ll> flow(int s, int t) {
    ll f = 0, c = 0;
    vector<ll> d(n + 1);
    vector<int> pv(n + 1), pe(n + 1), inq(n + 1);
    while (true) {
      fill(d.begin(), d.end(), LINF);
      queue<int> q; d[s] = 0; q.push(s); inq[s] = 1;
      while (!q.empty()) {
        int u = q.front(); q.pop(); inq[u] = 0;
        for (int i = 0; i < (int)g[u].size(); ++i) {
          E& e = g[u][i];
          if (e.cap && d[e.to] > d[u] + e.cost) {
            d[e.to] = d[u] + e.cost; pv[e.to] = u; pe[e.to] = i;
            if (!inq[e.to]) q.push(e.to), inq[e.to] = 1;
          }
        }
      }
      if (d[t] == LINF) break;
      ll aug = LINF;
      for (int v = t; v != s; v = pv[v]) aug = min(aug, g[pv[v]][pe[v]].cap);
      for (int v = t; v != s; v = pv[v]) {
        E& e = g[pv[v]][pe[v]];
        e.cap -= aug; g[v][e.rev].cap += aug;
      }
      f += aug; c += aug * d[t];
    }
    return {f, c};
  }
};
```

### 树链剖分

```cpp
struct HLD {
  int n, tim = 0;
  vector<vector<int>> g;
  vector<int> fa, dep, sz, son, top, dfn;
  HLD(int n = 0): n(n), g(n+1), fa(n+1), dep(n+1), sz(n+1), son(n+1), top(n+1), dfn(n+1) {}
  void add(int u, int v) { g[u].push_back(v); g[v].push_back(u); }
  void dfs1(int u, int p) {
    fa[u] = p; dep[u] = dep[p] + 1; sz[u] = 1;
    for (int v : g[u]) if (v != p) {
      dfs1(v, u); sz[u] += sz[v];
      if (sz[v] > sz[son[u]]) son[u] = v;
    }
  }
  void dfs2(int u, int tp) {
    top[u] = tp; dfn[u] = ++tim;
    if (son[u]) dfs2(son[u], tp);
    for (int v : g[u]) if (v != fa[u] && v != son[u]) dfs2(v, v);
  }
  int lca(int a, int b) {
    while (top[a] != top[b]) {
      if (dep[top[a]] < dep[top[b]]) swap(a, b);
      a = fa[top[a]];
    }
    return dep[a] < dep[b] ? a : b;
  }
};
```

### 线性基

```cpp
struct Basis {
  static const int LOG = 62;
  ll b[LOG] = {};
  void insert(ll x) {
    for (int i = LOG - 1; i >= 0; --i) if (x >> i & 1) {
      if (!b[i]) { b[i] = x; return; }
      x ^= b[i];
    }
  }
  ll max_xor(ll x = 0) {
    for (int i = LOG - 1; i >= 0; --i) x = max(x, x ^ b[i]);
    return x;
  }
};
```

### NTT

```cpp
const int G = 3; // MOD = 998244353
void ntt(vector<int>& a, bool inv) {
  int n = a.size();
  for (int i = 1, j = 0; i < n; ++i) {
    int bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) swap(a[i], a[j]);
  }
  for (int len = 2; len <= n; len <<= 1) {
    int wlen = qpow(G, (MOD - 1) / len, MOD);
    if (inv) wlen = inv_prime(wlen, MOD);
    for (int i = 0; i < n; i += len) {
      ll w = 1;
      for (int j = 0; j < len / 2; ++j) {
        int u = a[i+j], v = w * a[i+j+len/2] % MOD;
        a[i+j] = (u + v) % MOD;
        a[i+j+len/2] = (u - v + MOD) % MOD;
        w = w * wlen % MOD;
      }
    }
  }
  if (inv) {
    int ni = inv_prime(n, MOD);
    for (int& x : a) x = 1LL * x * ni % MOD;
  }
}

vector<int> multiply(vector<int> a, vector<int> b) {
  int n = 1, need = a.size() + b.size() - 1;
  while (n < need) n <<= 1;
  a.resize(n); b.resize(n);
  ntt(a, false); ntt(b, false);
  for (int i = 0; i < n; ++i) a[i] = 1LL * a[i] * b[i] % MOD;
  ntt(a, true); a.resize(need);
  return a;
}
```

### 莫队

```cpp
struct Query { int l, r, id; };
int B;
sort(q.begin(), q.end(), [](Query a, Query b) {
  int A = a.l / B, Bk = b.l / B;
  if (A != Bk) return A < Bk;
  return A & 1 ? a.r > b.r : a.r < b.r;
});
int l = 1, r = 0;
for (auto [ql, qr, id] : q) {
  while (l > ql) add(--l);
  while (r < qr) add(++r);
  while (l < ql) del(l++);
  while (r > qr) del(r--);
  ans[id] = cur;
}
```

## 8. 赛前检查

- 数组开到 `n + 5`，多测清空。
- `int * int` 先转 `1LL`。
- 图边是有向还是无向。
- 最短路边权是否可能为负。
- 取模减法写成 `(x - y + MOD) % MOD`。
- 递归深度大时改迭代或开栈。
- 输出格式：空格、换行、大小写。
