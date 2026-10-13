---
title: 计算机组成 03 · RISC-V 指令系统
tags:
  - 课程/计算机组成
---

# 03 · RISC-V 指令系统

> [!abstract] 导览
> 本篇围绕 RISC-V 讲指令系统：寄存器约定 → 内存与寻址 → 六种指令格式与立即数拼接 → 分支 / 过程调用 / 访存 / 跳转。**指令格式的字段布局和立即数拼接是本章必考内容**。
>
> - [[#1. 为什么是 RISC-V]]
> - [[#2. 寄存器约定]]
> - [[#3. 内存与寻址]]
> - [[#4. 指令格式（六种）]]
> - [[#5. 分支与循环]]
> - [[#6. 过程调用（Procedure）]]
> - [[#7. 载入与存储指令]]
> - [[#8. 跳转与大立即数]]
> - [[#9. 考点速查]]
>
> 讲义对应：[III. Instructions — mem.ac](https://mem.ac/course/co/note/3/)　教材第 2 章

---

## 1. 为什么是 RISC-V

> [!note] Why RISC-V?
> - **开放**（无授权费用，任何人可实现）。
> - 具有现代 **指令集架构(Instruction Set Architecture, ISA)** 的特征。
> - 类似的 ISA 在市场上占据很大份额（生态与工具链成熟）。

本课程与教材都围绕 RISC-V 展开，本篇也如此。

> [!important] RISC 的设计原则（贯穿整章）
> | 原则 | 在本章中的体现 |
> |---|---|
> | *Simplicity favors regularity* | 所有指令 32 位定长；一条指令只做一件事；格式只有 6 种 |
> | *Smaller is faster* | 32 个寄存器；寄存器访问远快于内存 |
> | *Make the common case fast* | `x0` 恒零、立即数寻址、伪指令 |
> | *Good design demands good compromises* | 定长 32 位 + 有限的立即数位数 |

---

## 2. 寄存器约定

RISC-V 提供 **32 个通用数据寄存器**，每个 **64 位**（RV64）。寄存器空间远小于内存，这是「smaller is faster」的直接体现。

| 寄存器 | ABI 名 | 用途 | 调用前后是否保持 |
|---|---|---|---|
| `x0` | `zero` | **常量 0**，写入被丢弃 | — |
| `x1` | `ra` | **返回地址(return address)** | caller 保存 |
| `x2` | `sp` | **栈指针(stack pointer)**，指向栈顶 | callee 恢复 |
| `x3` | `gp` | global pointer（编译器用于静态变量区） | — |
| `x4` | `tp` | thread pointer | — |
| `x5`–`x7` | `t0`–`t2` | **临时寄存器** | caller 保存 |
| `x8` | `s0` / `fp` | **保留寄存器** / frame pointer | callee 保存 |
| `x9` | `s1` | 保留寄存器 | callee 保存 |
| `x10`–`x17` | `a0`–`a7` | **过程参数 / 返回值** | caller 保存 |
| `x18`–`x27` | `s2`–`s11` | 保留寄存器 | callee 保存 |
| `x28`–`x31` | `t3`–`t6` | 临时寄存器 | caller 保存 |

![[co-ch3-HVDSFt0e.png]]

要点：

- **`x0` 永远为 0**：`add x0, ...` 无效果；`x0` 常用作「丢弃结果」的哑目标（如 `jalr x0, 0(x1)` 就是伪指令 `ret`）。
- **`ra`（x1）**：`jal` / `jalr` 会把下一条指令地址（`pc+4`）存入 `rd`。过程返回就是 `jalr x0, 0(x1)` ≡ `ret`。
- **栈从高地址向低地址增长**。压栈示例：

```asm
addi sp, sp, -24     # 开 24 字节栈空间
sd   x5,  16(sp)
sd   x6,   8(sp)
sd   x20,  0(sp)
```

- **临时 vs 保留**：
  - `t0`–`t6`：过程调用后**不保证**其值不变，需要保留则由 **caller** 保存。
  - `s0`–`s11`：保证调用前后不变；callee 若要用，必须**自己压栈并在返回前恢复**。
- **参数寄存器 `a0`–`a7`**：前 8 个参数放寄存器；**超过 8 个的放栈上**（例如放在 `fp` 上方，`fp+8` 是第 9 个参数，`fp+16` 是第 10 个……）。返回值也放这里，C 语言通常只有 1 个，放在 `a0`。
- 另有浮点寄存器 `f0`–`f31`（本课程不重点讨论）。

> [!note] `gp` 与 `fp` 的补充
> - `x3`（`gp`）指向静态变量区，便于用一条指令访问全局变量。
> - `x8` 在一些编译器中作 **frame pointer `fp`**，指向 activation record 的第一个 dword，进入函数时用 `sp` 初始化。
> - **`fp` 的价值**：对局部变量的所有引用相对于 `fp` 的偏移在整个过程中**固定不变**，而相对于 `sp` 不一定（因为过程中还可能继续 push/pop）。若过程里没有栈变化或没有局部变量，就不必用 `fp`。

---

## 3. 内存与寻址

### 3.1 基本单位

- 以 **8 位为一个字节(byte)** 存储，地址宽度 **64 位**。
- 一个 **word = 32 位**，一个 **双字(doubleword) = 64 位**。
- 可寻址 $2^{64}$ 个字节 = $2^{67}$ 个 bit = $2^{61}$ 个 dword。

### 3.2 小端存储（Little Endian）

**最低有效位放在内存最低处**。存储 `0x12345678` 的结果是：

```text
低地址                                高地址
  78    56    34    12
```

> [!tip] 记忆
> 「小端 = 小（低位）的在前面（低地址）」。若按从左到右书写的常规直觉，那对应的其实是**大端存储(Big Endian)**。

### 3.3 内存对齐（Memory Alignment）

CPU 一次访问只能读出内存的「一行」（例如 4 字节），若一个数据跨越了两行的边界，就需要两次访问。因此编译器会把数据按**其大小的整数倍**地址摆放，这就是**内存对齐**。

> [!note] 例
> ![[co-ch3-LrRHT6l4.png]]

### 3.4 常量 vs 立即数

**常量(constant)** 可以由编译器「先从指定地址取值」来实现，但这要多一次访存。为了让常用情况更快，引入**立即数(immediate operand)**，把常用小常数直接编进指令里，省掉寻址时间。（*make the common case fast*）

### 3.5 四种寻址方式

| 寻址方式 | 说明 | 例 |
|---|---|---|
| **立即数寻址** immediate | 操作数在指令里 | `addi x5, x6, 10` |
| **寄存器寻址** register | 操作数在寄存器里 | `add x5, x6, x7` |
| **基址寻址** base | 地址 = 寄存器 + 偏移 | `8(sp)` |
| **PC 相对寻址** PC-relative | 地址 = PC + 偏移 | `beq x1, x2, label` |

![[co-ch3-cKPQXFYu.png]]

> [!note] 内存布局
> ![[co-ch3-HgSNu9rL.png]]

---

## 4. 指令格式（六种）

**机器码(machine code)**：按存储程序原理，每条指令都用二进制编码表示。RISC-V 的**所有指令都是 32 位定长**（*good design demands good compromises*），且**一条指令只做一件事**（*simplicity favors regularity*）。

![[co-ch3-KcGbrnLp.png]]

字段缩写：

- `rs1` / `rs2`：**源寄存器(register source)**
- `rd`：**目标寄存器(register destination)**
- `imm`：**立即数(immediate operand)**
- `opcode`：**操作编码(operation code)**（bit 6:0，永远在最低 7 位）
- `funct3` / `funct7`：**功能编码(function code)**，与 `opcode` 共同确定具体运算

### 4.1 六种格式的位布局

| 类型 | 31:25 | 24:20 | 19:15 | 14:12 | 11:7 | 6:0 | 典型指令 |
|---|---|---|---|---|---|---|---|
| **R** | `funct7` | `rs2` | `rs1` | `funct3` | `rd` | `opcode` | `add` `sub` `and` `or` `slt` |
| **I** | `imm[11:0]` | `rs1` | `funct3` | `rd` | `opcode` | | `addi` `ld` `jalr` |
| **S** | `imm[11:5]` | `rs2` | `rs1` | `funct3` | `imm[4:0]` | `opcode` | `sd` `sb` `sw` |
| **B** | `imm[12\|10:5]` | `rs2` | `rs1` | `funct3` | `imm[4:1\|11]` | `opcode` | `beq` `bne` `blt` |
| **U** | `imm[31:12]` | | | | `rd` | `opcode` | `lui` `auipc` |
| **J** | `imm[20\|10:1\|11\|19:12]` | | | | `rd` | `opcode` | `jal` |

功能说明：

- **R 型**：寄存器间的算术逻辑运算，`rd = rs1 op rs2`；具体运算由 `opcode` + `funct3` + `funct7` 共同决定。
- **I 型**：寄存器与立即数运算，或只需一个源寄存器的指令（load、`jalr`），`rd = rs1 op imm`。
  - 虽然 `imm` 只有 12 位，但参与运算前会**符号扩展到 64 位**，故实际立即数为 `{{52{inst[31]}}, inst[31:20]}`。
  - **移位类**（`slli`、`srli`、`srai`）是特殊的 I 型：对 64 位数移位 $\ge 64$ 位没有意义，所以把 12 位拆成 **6 位 funct6 + 6 位移位量 immed**。
- **S 型**：store 类。`rs1` 是**基址寄存器**编号，`rs2` 是**源操作数**编号，立即数被拆成两段（`imm[11:5]` 与 `imm[4:0]`）以保持 `rs1`/`rs2` 的位置与 R 型一致。
  - 例：`sd x9, 64(x22)` ⇒ `rs1 = 22`，`rs2 = 9`，`imm = 64`。
- **U 型**：只有高位 20 位立即数，用于构造大常数（`lui` / `auipc`）。
- **B 型**：条件分支，立即数是**以 2 字节为单位的偏移**。
- **J 型**：无条件跳转 `jal`，立即数同样是 2 字节单位。

> [!important] 为什么 B 型与 J 型不存立即数的最低位 `imm[0]`
> 这两种指令的立即数表示的是**跳转偏移**，而指令地址是按 **2 字节对齐**的（指令本身 4 字节对齐 ⇒ 更低），偏移的最低位**一定为 0**，因此无需存储，硬件解码时直接补 0。这样 B 型能表示 ±4 KiB、J 型能表示 ±1 MiB 的范围。

### 4.2 立即数拼接公式（RV64）

| 类型 | 立即数（64 位） |
|---|---|
| I | `{{52{inst[31]}}, inst[31:20]}` |
| S | `{{52{inst[31]}}, inst[31:25], inst[11:7]}` |
| B | `{{51{inst[31]}}, inst[31], inst[7], inst[30:25], inst[11:8], 1'b0}` |
| U | `{{32{inst[31]}}, inst[31:12], 12'b0}` |
| J | `{{43{inst[31]}}, inst[31], inst[19:12], inst[20], inst[30:21], 1'b0}` |

> [!tip] 记法的读法
> `{{n{x}}, ...}` 表示「把 x 重复 n 次做符号扩展」。所有立即数在送往 ALU 前都要**符号扩展**到 64 位（U 型例外：它把 20 位放到高位、低 12 位补 0）。

### 4.3 opcode 与 funct 速查

| 指令组 | opcode | funct3 | funct7 / 其他 |
|---|---|---|---|
| R 型 | `0110011` | `add/addw 000`, `sll 001`, `slt 010`, `sltu 011`, `xor 100`, `srl 101`, `or 110`, `and 111` | `funct7 = 0000000`（`sub`/`sra` 为 `0100000`） |
| I 型算术 | `0010011` | `addi 000`, `slti 010`, `xori 100`, `ori 110`, `andi 111`, `slli 001`, `srli 101`, `srai 101` | 移位用 funct6：`srai` = `010000` |
| Load | `0000011` | `lb 000`, `lh 001`, `lw 010`, `ld 011`, `lbu 100`, `lhu 101`, `lwu 110` | |
| Store | `0100011` | `sb 000`, `sh 001`, `sw 010`, `sd 011` | |
| Branch | `1100011` | `beq 000`, `bne 001`, `blt 100`, `bge 101`, `bltu 110`, `bgeu 111` | |
| `jal` | `1101111` | | J 型 |
| `jalr` | `1100111` | `000` | I 型 |
| `lui` | `0110111` | | U 型 |
| `auipc` | `0010111` | | U 型 |

> [!note] 考试通常给出 opcode/funct
> 原讲义也提示「部分指令的 opcode 和 funct 会在考试时给出」。需要背牢的是**六种格式的字段布局**和**立即数拼接方式**。

### 4.4 指令格式便查表

![[co-ch3-Iygimvey.png]]

### 4.5 常用伪指令（Pseudo Instructions）

伪指令不是真实指令，**汇编器会展开成一条或几条真指令**——掌握展开方式是理解「RISC-V 指令很少却很好用」的关键。

| 伪指令 | 展开为 |
|---|---|
| `nop` | `addi x0, x0, 0` |
| `li rd, imm` | `addi rd, x0, imm`（小立即数）／`lui` + `addi`（32 位） |
| `mv rd, rs` | `addi rd, rs, 0` |
| `not rd, rs` | `xori rd, rs, -1` |
| `neg rd, rs` | `sub rd, x0, rs` |
| `ret` | `jalr x0, 0(x1)` |
| `j label` | `jal x0, label` |
| `jr rs` | `jalr x0, 0(rs)` |
| `beqz rs, label` | `beq rs, x0, label` |
| `bnez rs, label` | `bne rs, x0, label` |
| `bgt rs, rt, label` | `blt rt, rs, label`（**交换操作数**） |
| `ble rs, rt, label` | `bge rt, rs, label`（交换操作数） |
| `la rd, symbol` | `auipc rd, ...` + `addi rd, rd, ...` |

![[co-ch3-ABLaJ0cn.png]]

---

## 5. 分支与循环

### 5.1 相等判断

- `beq rs1, rs2, label`（B 型）：相等则跳转
- `bne rs1, rs2, label`（B 型）：不相等则跳转

### 5.2 大小比较

> [!warning] 默认是**有符号**比较
> `blt` / `bgt` / `ble` / `bge` 都是**有符号**比较；无符号比较必须用 `bltu` / `bgeu`。

- `blt rs1, rs2, label`：`if (rs1 < rs2) goto label`
- `bgt rs1, rs2, label`：`if (rs1 > rs2) goto label`
- `ble rs1, rs2, label`：`if (rs1 <= rs2) goto label`
- `bge rs1, rs2, label`：`if (rs1 >= rs2) goto label`

> [!note] RISC-V 没有单独的「大于/小于等于」指令
> `bgt` / `ble` 等是**伪指令**，汇编器会交换两个寄存器后映射到 `blt` / `bge`。

### 5.3 最常用的比较：`slt`

- `slt rd, rs1, rs2`：set on less than，`rs1 < rs2` 时令 `rd = 1`
- 常与 `beq` / `bne` 配合实现任意比较（如 `slt` + `beq` 实现「大于」）

### 5.4 远距离分支

若分支体/循环体很长，目标超出 B 型的 ±4 KiB 范围，需要改用 `jal` 或 `jalr`，必要时**反转条件**：

```asm
    bne  x1, x2, skip    # 条件反转：不满足则跳过
    jal  x0, far_label   # 远跳转（伪指令 j）
skip:
    ...
```

![[co-ch3-bUcump8l.png]]

---

## 6. 过程调用（Procedure）

### 6.1 六步约定

1. **传参**：把参数放进 `a0`–`a7`。
2. **调用**：`jal x1, label`（`jal` 把 `pc+4` 存进 `ra`，实现返回）。
3. **取栈空间**：callee 用 `addi sp, sp, -N` 开辟自己的帧。
4. **执行**：callee 干活。
5. **返回**：把结果放进 `a0`，恢复用过的保留寄存器与 `sp`，用 `jalr x0, 0(x1)`（= `ret`）返回。
6. **恢复**：caller 继续。

> [!important] 嵌套调用必须保存 `ra`
> 如果过程体内**还要调用其他过程**，`ra` 会被覆盖，因此必须先把 `ra` 压栈，返回前再恢复。

### 6.2 push / pop

```asm
# push：先减 sp，再存
addi sp, sp, -8
sd   x?, 8(sp)      # 注意偏移写法与自己的约定一致

# pop：先取，再加 sp
ld   x?, 8(sp)
addi sp, sp, 8
```

![[co-ch3-sFba4Dmg.png]]

### 6.3 栈帧与 `fp`

`fp`（`x8`）指向当前栈帧的基准位置，在函数调用过程中保持不变，便于用**固定偏移**访问局部变量与保存的参数。

![[co-ch3-ut3O9gGP.png]]

> [!note] 例：编译递归阶乘函数
> ![[co-ch3-XYw3FYUD.png]]
>
> 递归函数是「嵌套调用必须保存 `ra`」的典型：每次递归调用前都要把 `ra`（以及必要的参数/局部变量）压栈，否则返回地址会被覆盖。

---

## 7. 载入与存储指令

`load` / `store` 是**唯二**在寄存器与内存之间传输数据的指令（RISC-V 没有「读内存同时运算」的指令，这是 RISC 的重要特征）。

> [!important] 扩展规则（高频考点）
> 寄存器是 64 位，而从内存读入的更短数据必须**扩展**：**`l` 系列（lb/lh/lw）符号扩展**，**`l` + `u` 系列（lbu/lhu/lwu）零扩展**。

### 7.1 Load（I 型）

**符号扩充**：

| 指令 | 含义 |
|---|---|
| `lb rd, offset(rs1)` | 读 8 位，**符号扩展**到 64 位 |
| `lh rd, offset(rs1)` | 读 16 位，符号扩展 |
| `lw rd, offset(rs1)` | 读 32 位，符号扩展 |
| `ld rd, offset(rs1)` | 读 64 位，无需扩展 |

**零扩充**：

| 指令 | 含义 |
|---|---|
| `lbu rd, offset(rs1)` | 读 8 位，零扩展（常用于读 ASCII 字符） |
| `lhu rd, offset(rs1)` | 读 16 位，零扩展 |
| `lwu rd, offset(rs1)` | 读 32 位，零扩展 |

### 7.2 Store（S 型）

store 保存寄存器中**最低**的若干位：

| 指令 | 含义 |
|---|---|
| `sb rs2, offset(rs1)` | 存最低 8 位 |
| `sh rs2, offset(rs1)` | 存最低 16 位 |
| `sw rs2, offset(rs1)` | 存最低 32 位 |
| `sd rs2, offset(rs1)` | 存最低 64 位 |

> [!note] 例：字符串拷贝
> ![[co-ch3-607BHJlv.png]]

---

## 8. 跳转与大立即数

### 8.1 `jal`（J 型）与 `jalr`（I 型）

- **`jal rd, label`**：`rd = pc + 4`，`pc = pc + imm`（保存返回地址并跳转）
- **`jalr rd, imm(rs1)`**：`rd = pc + 4`，`pc = (imm + rs1) & 0xFFFFFFFE`
  - 注意 `pc` 最低位**一定被置 0**（半字对齐），这是硬件保证的。

> [!note] 例：跳转地址表（switch 语句）
> ```cpp
> switch (k) {
>     case 0: f = i + j; break;
>     case 1: f = g + h; break;
>     case 2: f = g - h; break;
>     case 3: f = i - j; break;
> }
> ```
> 汇编实现（用 `jalr` 跳转表）：
>
> ![[co-ch3-cYBpIP5o.png]]

### 8.2 基本块（Basic Block）

> [!note] 定义
> 一段（**除了开头**）没有分支标签、且（**除了结尾**）没有跳转语句的指令序列称为一个**基本块(basic block)**。编译器识别基本块后可以做局部优化与调度。

### 8.3 label → offset 的换算

label 在汇编时被换算成具体的偏移：

- 一条指令长 4 字节，所以「目标地址 − 当前地址」应是**指令数 × 4**；
- 但 **PC 相对寻址以半字（2 字节）为单位**，所以偏移的**最低位强制为 0**，并且这一位**不编进机器码**（B 型 / J 型的特性）。

> [!note] 例：计算偏移
> - C 代码：
>   ```cpp
>   while (save[i] == k) i = i + 1;
>   ```
> - RISC-V 汇编：
>
>   ![[co-ch3-cPr6MSEe.png]]
> - 机器码：
>
>   ![[co-ch3-jjYmiuAy.png]]

### 8.4 `lui` 与大立即数

- **`lui rd, imm`**（U 型）：`rd = imm << 12`，把 20 位立即数放到高 20 位。

**构造 32 位大常数**：先用 `lui` 设置高 20 位，再用 `addi` 设置低 12 位。

> [!warning] 一个经典陷阱：`addi` 的符号位
> `addi` 是**有符号**的，第 12 位会被当作符号位。如果我们需要这个低位为 1（即低 12 位的最高位是 1），那么用 `lui` 设置高 20 位时必须**先 +1**，否则 `addi` 的符号扩展会借走高位、结果少 $2^{12}$。
>
> 例：要得到 `0x12345FFF`，低 12 位 `0xFFF` 的最高位是 1 ⇒ `lui` 应装入 `0x12346`，再 `addi x, x, -1`。

**跳转到任意 32 位地址**：

```asm
lui  t0, address[31:12]
jalr x0, address[11:0](t0)     # rd 用 x0 表示不需要保存返回地址
```

---

## 9. 考点速查

1. **32 个 64 位寄存器**；`x0` 恒零；`ra`=x1 存返回地址；`sp`=x2；`a0`–`a7` 传参/返值；`t*` 由 caller 保存；`s*` 由 callee 保存。
2. **超过 8 个参数放栈上**；返回值放 `a0`。
3. **小端存储**：低位字节在低地址。`0x12345678` ⇒ `78 56 34 12`。
4. **内存对齐**的目的是让一次访问不跨越内存行边界。
5. **六种格式的字段布局必须背**：R/I/S/B/U/J，注意 `opcode` 永远在 bit 6:0，`rd` 在 11:7，`rs1` 在 19:15，`rs2` 在 24:20。
6. **B 型 / J 型不存 `imm[0]`**：因为跳转偏移以 2 字节为单位、最低位必为 0。
7. **立即数拼接**：I/S/B/U/J 五种，注意符号扩展的位宽（52/51/32/43）。
8. **`blt`/`bge` 默认有符号**；无符号用 `bltu`/`bgeu`；`bgt`/`ble` 是伪指令。
9. **过程调用**：`jal x1, label` 进入，`jalr x0, 0(x1)`（`ret`）返回；**嵌套调用必须先保存 `ra`**。
10. **load 扩展规则**：`lb/lh/lw` **符号扩展**，`lbu/lhu/lwu` **零扩展**；store 只存低位若干位。
11. **`jalr` 会把 PC 最低位置 0**（半字对齐）。
12. **`lui` + `addi` 构造 32 位常数**时，若低 12 位最高位为 1，`lui` 的立即数要先 +1。
13. **基本块**：除开头外无标签、除结尾外无跳转。
14. `switch` 用 `jalr` 跳转表实现。

---

## 参考

- 原始讲义：[III. Instructions — mem.ac](https://mem.ac/course/co/note/3/)
- [RISC-V 手册（中文版）](http://riscvbook.com/chinese/RISC-V-Reader-Chinese-v2p1.pdf)
- 教材：Patterson & Hennessy, *COD: RISC-V Edition*（第 5 版），第 2 章
