---
title: 计算机组成 05 · 存储层次：Cache 与虚拟内存
tags:
  - 课程/计算机组成
---

# 05 · 存储层次：Cache 与虚拟内存

> [!abstract] 导览
> 本篇讲「CPU 很快、内存很慢」这个矛盾的两级解法：**Cache** 解决 SRAM 与 DRAM 之间的速度差，**虚拟内存 + TLB** 解决 DRAM 与磁盘之间的容量差。核心是三个问题——**放哪（placement）、怎么认（identification）、换谁（replacement）**。
>
> - [[#1. 存储层次与两种 RAM]]
> - [[#2. 局部性原理与 Cache 的动机]]
> - [[#3. Cache 映射策略]]
> - [[#4. 命中与缺失的处理]]
> - [[#5. Cache 性能计算]]
> - [[#6. 虚拟内存]]
> - [[#7. 快表 TLB]]
> - [[#8. 考点速查]]
>
> 讲义对应：[V. Memory — mem.ac](https://mem.ac/course/co/note/5/)　教材第 5 章

---

## 1. 存储层次与两种 RAM

| | **静态随机访问存储器 SRAM** | **动态随机访问存储器 DRAM** |
|---|---|---|
| 存储元件 | 晶体管（一位通常 6~8 个） | 电容 |
| 是否需要刷新 | **不需要** | **需要定期刷新**（refresh） |
| 速度 | **快** | 慢（一般是 SRAM 的 **5~10 倍**） |
| 物理空间 | 占用**高**（密度低） | 占用**低**（密度高） |
| 成本 | 贵 | 便宜 |
| 用途 | **Cache** | **主存(main memory)** |

> [!important] 内存层次(memory hierarchy)
> 不可能把所有数据都放 SRAM，只把**一小部分**放 SRAM（作 Cache），**大部分**放 DRAM（作主存），再往下是磁盘。越靠上越快越贵越小，越靠下越慢越便宜越大。
>
> ![[co-ch5-ZcczK4K0.png]]

---

## 2. 局部性原理与 Cache 的动机

CPU 执行速度远快于 DRAM，若每次访存都直接读 DRAM，CPU 就要为等待主存暂停若干时钟周期。而程序的访存有规律可循：

- **时间局部性(temporal locality)**：近期访问过的项目**很可能在短时间内再次被访问**。
  - 例：循环中的指令、循环中用来计数的变量(induction variables)。
- **空间局部性(spatial locality)**：近期访问项目**附近**的项目很可能在短时间内被访问。
  - 例：连续的指令执行、数组变量。

> [!tip] Cache 的全部设计都建立在局部性上
> 局部性越强，Cache 命中率越高。这也解释为什么「能顺序访问数组」比「随机访问链表」快得多——同样的指令数，命中率差一大截。

---

## 3. Cache 映射策略

> [!note] Block（块/行）
> 把相邻的若干 byte 合并为一个**块(block)**，Cache 的一切操作都以 block 为基本单位。把 byte 地址的**低若干位**（称为**块内偏移(byte offset)**）拿掉，就得到 **block address**。一个 block 含 $2^{\#(\text{byte offset})}$ 个字节。

三种映射策略对三个经典问题的回答：

![[co-ch5-XQHOmHlB.png]]

| 问题 | **直接映射** | **全相连** | **组相连** |
|---|---|---|---|
| **Q1 块放置**<br>(Block Placement) | 每个块只能放到**唯一**位置：`block address MOD 缓存块数` | 块可以放**任意**位置 | 块可放在**某一组**内的任意位置：`block address MOD 组数`；$n$ 路组相连中每组有 $n$ 个块 |
| **Q2 块识别**<br>(Block Identification) | 用**索引 index** 选定块，再比 tag | 用**标签 tag** 与所有块比较 | 用 index 选定组，再用 tag 匹配组内的块 |
| **Q3 块替换**<br>(Block Replacement) | **不存在**替换问题（位置固定） | 随机 / LRU / FIFO | 在**组内**做替换，随机 / LRU / FIFO |

### 3.1 直接映射（Direct Map）

每个内存块**唯一映射**到一个 Cache 块。

![[co-ch5-PCNbpY7S.png]]

上图：memory 有 $2^5 = 32$ 个 block，cache 有 $2^3 = 8$ 个 block，直接用地址的**低 3 位**作为 cache 地址，称为**索引 index**。为了知道 cache 里装的到底是内存的哪个块，还要额外存地址的**高 2 位**，称为**标签 tag**。

另外需要一位**有效位(valid bit)**：初始全部为 0（无效），从内存取入 block 后置 1。

> [!important] Cache 命中的充要条件
> **`valid bit == 1` 且 `tag` 与目标地址的高位一致**。

![[co-ch5-PTUhlfoQ.png]]

地址的三个字段：

| 字段 | 作用 |
|---|---|
| **tag** | 标识这是内存中的哪一个块（唯一性） |
| **index** | 定位到 cache 中的哪一块（哪一行） |
| **offset** | 定位块内的具体字节 |

> [!note] 直接映射计算题的四个步骤
> 1. 由「一个 block 有多少 byte / word」算出 **offset** 位数；
> 2. 由「cache 包含多少个 block（= cache 行数）」算出 **index** 位数；
> 3. 地址**剩下的位**就是 **tag**；
> 4. 不要忘了 cache 里每行还要存 **valid bit、data bits、tag bits、dirty bit（可选）**；并且注意 **index 位本身并不存在 cache 里**（它是用来选行的，不需要存储）。
>
> **例题（补充）**：32 位地址、64 KB Cache、块大小 64 B、直接映射、写回 + 写分配。
> - offset $= \log_2 64 = 6$ 位
> - 行数 $= 64\,\text{KB} / 64\,\text{B} = 1024$ ⇒ index $= 10$ 位
> - tag $= 32 - 6 - 10 = 16$ 位
> - 整个 Cache 的存储开销 $= 1024 \times (\underbrace{64 \times 8}_{\text{数据}} + \underbrace{16}_{\text{tag}} + \underbrace{1}_{\text{valid}} + \underbrace{1}_{\text{dirty}})$ bit

### 3.2 全相连（Fully Associative）

块可以放到 cache 中的**任意**位置（所有块之间都有连线）。

代价：判断命中时要**与所有块同时比较**，硬件复杂度大。

> [!important] 全相连没有 index
> 无论地址划分还是 cache 空间中，都**不存在 index 字段**——只有 tag + offset。

![[co-ch5-jYFHq6QI.png]]

替换策略：

| 策略 | 说明 |
|---|---|
| **随机替换(random)** | 随机挑一个块换掉（需要随机数生成器） |
| **先进先出(FIFO)** | 换掉**进入时间最早**的块 |
| **最近最少使用(LRU)** | 换掉**上一次使用时间距今最远**的块（需要额外位记录使用信息） |

### 3.3 组相连（Set Associative）

介于直接映射与全相连之间：每个 block 根据 block address 对应到**某一组** cache blocks，组内采用全相连的替换算法。

![[co-ch5-tVrBA8zf.png]]

上图是 2-way set associative 的示意。以 4-way 为例的原理图（**一行表示一个组**，用 MUX 在组中选择匹配的 line）：

![[co-ch5-HTghKphL.png]]

> [!important] associativity（相联度）
> 组的大小称为 **associativity**。判断 hit 时需要比较的次数**就等于 associativity**（越相连越慢越贵，但冲突缺失越少）。

---

## 4. 命中与缺失的处理

按「读/写 × 命中/缺失 × 指令/数据」分类讨论（这套分类直接决定第 5 节的性能公式）：

### 4.1 读（Read）

- **命中**：直接从 cache 读。
- **缺失**：
  - **数据缺失**：把对应 block 从 memory 取到 cache，再读所需内容（可能还要替换某一行）。
  - **指令缺失**：**暂停 CPU**，把 block 取到 cache，然后**从第一个 step 重新运行当前这条指令**（指令取指失败时无法部分完成）。

### 4.2 写（Write）

**写命中**：

| 策略 | 做法 | 优缺点 |
|---|---|---|
| **写穿(write-through)** | 每次写都**同时写 cache 和主存** | cache 与主存**始终一致**（实现简单），但写主存慢 |
| **写回(write-back)** | **只改 cache**，等该块被**替换出去时**才写回主存 | 需要额外的**脏位(dirty bit)**；对「同一个块内连续多次修改」的优化巨大 |

> [!note] write buffer（写缓冲）
> write-through 的常见改进：要写主存时先放进**缓冲队列**，让 CPU 继续执行。队列满时仍需暂停 CPU。**注意**：如果主存写入速率本身就低于 CPU 产生写操作的速率，**多大的缓冲都无济于事**。

**写缺失**：

| 策略 | 做法 | 配合 |
|---|---|---|
| **写绕(write-around)** | 直接在主存中修改，不把块取进 cache | 一般搭配 write-through |
| **写分配(write-allocate)** | 先把对应块取进 cache 再写 | **write-back 必须搭配 write-allocate** |

![[co-ch5-kBa9D2g0.png]]

> [!tip] 为什么 write-back 必须配 write-allocate
> write-back 的语义是「以 cache 为写入的唯一权威、替换时才回写」；若写缺失时不把块取进来，就没法在 cache 里记录这次修改，脏位也失去意义。而 write-through 本身就会同步写主存，所以两种情况都能配。

---

## 5. Cache 性能计算

无论采用什么策略都不能保证每次都命中；一旦 miss 就要等若干时钟周期访问主存，这一代价称为**缺失代价(miss penalty)**。

**平均访存时间(Average Memory Access Time, AMAT)**：

$$ \boxed{\ \text{AMAT} = \text{Hit Time} + \text{Miss Rate} \times \text{Miss Penalty}\ } $$

一般用 **CPU 时间**衡量 cache 性能：在原有 CPU 执行时间上，加上因 miss 而惩罚的时间：

$$ \text{CPU Time} = (\text{CPU execution clock cycles} + \text{memory-stall clock cycles}) \times \text{clock cycle time} $$

- **读延迟周期**：

$$ \text{Read-stall cycles} = \frac{\text{Reads}}{\text{Program}} \times \text{Read Miss Rate} \times \text{Read Miss Penalty} $$

- **写延迟周期**：

$$ \text{Write-stall cycles} = \frac{\text{Writes}}{\text{Program}} \times \text{Write Miss Rate} \times \text{Write Miss Penalty} + \text{Write Buffer Stalls} $$

  - 若 write buffer 的停顿很小，可忽略不计；
  - 若 **block size 为 1**（每次只搬一个字），则 write miss penalty 近乎为 0。

- **write-through cache 的简化式**（读写缺失代价近似相同）：

$$ \text{Memory-stall clock cycles} = \frac{\text{Memory Accesses}}{\text{Program}} \times \text{Miss Rate} \times \text{Miss Penalty} $$

> [!important] 缺失代价的构成（常见考法）
> $\text{Miss Penalty} = \text{访问主存的延迟} + \text{传输整个 block 的时间}$。
> **block 变大**：空间局部性利用更好、miss rate 下降，但**传输时间上升** ⇒ miss penalty 上升。总性能是这两者的权衡。

### 5.1 缺失的三种来源（3C，补充）

| 类型 | 成因 | 消除办法 |
|---|---|---|
| **强制缺失(compulsory / cold)** | 第一次访问该块，Cache 里必然没有 | 无法消除（预取可缓解） |
| **容量缺失(capacity)** | Cache 装不下工作集，被替换掉的块又马上要用 | 增大 Cache |
| **冲突缺失(conflict)** | 多个块映射到**同一组**，互相挤掉 | 提高相联度（全相连可消除） |

> [!note] 多级 Cache 的 AMAT
> $\text{AMAT} = \text{HitTime}_{L1} + \text{MissRate}_{L1} \times \text{MissPenalty}_{L1}$，其中
> $\text{MissPenalty}_{L1} = \text{HitTime}_{L2} + \text{MissRate}_{L2} \times \text{MissPenalty}_{L2}$。
> 即「L1 的缺失代价」本身就是一次 L2 的访存时间——层层嵌套，这就是「存储层次」在公式上的体现。

---

## 6. 虚拟内存

为了让**多个程序共用一套地址**、同时**扩大寻址空间**，引入**虚拟内存(virtual memory)**，与**物理内存(physical memory)** 相对。数据最终仍需加载到物理内存，本节的关注点是**虚拟地址 → 物理地址的转换**。

### 6.1 页与页表

- **页(page)** 是虚拟内存与物理内存的基本单元，类比 cache 中的 block / line。
- 好处有两个：
  1. 利用内存访问的**连续性**（整页搬迁）；
  2. **页表可以更小**——因为虚拟地址与物理地址的**页内偏移(page offset) 部分完全相同**，不需要转换。
- 程序需要的内存一开始在**磁盘**上，通过虚拟地址索引；用到时才从磁盘取入物理内存。这条物理地址是**实时分配**的，所以需要**页表(page table)** 记录「虚拟页 → 物理页」的映射。

![[co-ch5-yyoQ90oT.png]]

> [!important] 页错误（Page Fault）
> 在 page table 中 miss ⇒ 发生**页错误(page fault)**：请求的页不在主存，而在磁盘上。此时**由操作系统**负责把该页从磁盘取入主存（可能还要换出一个页）。

### 6.2 为什么虚拟内存只能用 write-back

> [!warning] 虚拟内存只能配 write-back，不能配 write-through
> 因为「下一层」是**磁盘**，写一次磁盘极慢。如果采用 write-through，一旦 miss 就要等磁盘写完，完全不可接受。因此页表项用**脏位**记录修改，只在页被换出时才写回磁盘。

> [!note] 「page table 是 DRAM 到 disk 的缓存」这个说法
> 大体说得通（层次上确实对应），但**并不严谨**：page table 里**不存数据**，只存转换关系；数据仍在物理内存（DRAM 层）中。
>
> 那 page table 是全相连还是直接映射？两种理解都有人用：
> - 把 page table 看作「DRAM 层 → 外部存储的 cache」⇒ 任意虚拟页都能映射到任意物理页 ⇒ 说它**全相连**；
> - 把 page table 看作「虚拟地址 → 物理地址的转换函数」，直接根据虚拟地址查表 ⇒ 说它**直接映射**。
>
> 取决于语境，**不必太纠结**。

---

## 7. 快表 TLB

> [!warning] 名称更正
> 原文写作 *Translation-lookahead Buffer*，标准名称是 **Translation Lookaside Buffer（TLB，快表）**——"lookaside" 是「旁视/旁路」的意思。

page table 很大、存在 DRAM 中，访问它和访问主存一样慢。于是给 page table 再做一个缓存：**TLB**。TLB 放在 **SRAM** 中，一般采用**组相连**（也可以用其他两种），作为 page table 的 cache。

- **TLB 命中**：直接得到物理地址；
- **TLB 缺失**：才去 page table 中查找。

把 TLB、page table、cache、主存放在一起，就是下面这张访问流程图。据此可以很好地分析课件中「possible / impossible」类判断题：

![[co-ch5-VT7hwrqh.png]]

> [!important] 两条**不可能**的判断（高频考点）
> 1. **page table 中 miss ⇒ 不可能在 TLB 中 hit**。因为 TLB 里的项都是**从 page table 取出来**放进去的；page table 里没有，TLB 不可能有。
> 2. **page table 与 TLB 都 miss ⇒ 不可能在 cache 中 hit**。因为一个页能出现在 cache 里，说明它已经被分配了物理地址，那就**一定**能在 page table 中查到。
>
> 反之，「TLB hit 但 cache miss」「page table miss 但内存里有数据」等都是可能的。

![[co-ch5-IwvSuBr8.png]]

### 7.1 TLB 的近似 LRU

组相连的 TLB 一般用 LRU，但完整 LRU 开销大，于是用**近似 LRU**：

- 在 TLB 每行加一个 **reference bit（原文写作 rel bit，即 ref bit）**；
- CPU **每隔一段时间把所有 ref bit 清 0**，访问过的行置 1；
- 需要替换时，挑一个 **ref bit 为 0** 的行换掉即可。

### 7.2 TLB 需要脏位吗？

> [!note] 需要
> 因为虚拟内存采用 **write-back**：修改一个页后必须把它的脏位置 1。而既然采用 write-back，这个页**肯定已经被加载进 TLB**，所以只需在 **TLB 中**置脏位，等该页被移出 TLB 时再把修改应用到 page table 即可。
>
> 如果不在 TLB 中实现脏位，则每次标记脏位都要去操作 page table，带来额外时间开销；而不操作又无法保证数据一致性。

---

## 8. 考点速查

1. **SRAM vs DRAM**：SRAM 用触发器（6~8 晶体管/位）、不刷新、快、贵、密度低 ⇒ Cache；DRAM 用电容、要刷新、慢 5~10 倍、便宜 ⇒ 主存。
2. **两种局部性**：时间局部性、空间局部性——Cache 存在的前提。
3. **三策略的 Q1/Q2/Q3**：直接映射（位置唯一、靠 index + tag、无替换）、全相连（任意位置、只比 tag、需替换算法）、组相连（组内任意、index 选组 + tag 选路）。
4. **全相连没有 index**（地址里没有，cache 里也不存）。
5. **hit 条件**：`valid == 1` 且 `tag` 匹配。
6. **直接映射计算题四步**：offset ← 块大小；index ← Cache 行数；tag ← 剩余位；别忘了 valid/data/tag/dirty 的开销，且 **index 不占 cache 存储**。
7. **写策略搭配**：write-through ↔ write-around；**write-back 必须配 write-allocate**；虚拟内存只能 write-back。
8. **AMAT = Hit Time + Miss Rate × Miss Penalty**；CPU 时间 = (执行周期 + 停等周期) × 周期时间。
9. **3C**：强制 / 容量 / 冲突，分别用预取 / 增大容量 / 提高相联度应对。
10. **page table 与 TLB 的两条不可能**：page table miss ⇒ TLB 不可能 hit；page table 与 TLB 都 miss ⇒ cache 不可能 hit。
11. **TLB 用 ref bit 做近似 LRU**；TLB 需要 dirty bit（配合 write-back）。
12. 虚拟地址与物理地址的**页内偏移相同**，只有页号需要转换——这是页表能变小的原因。

---

## 参考

- 原始讲义：[V. Memory — mem.ac](https://mem.ac/course/co/note/5/)
- 教材：Patterson & Hennessy, *COD: RISC-V Edition*（第 5 版），第 5 章
