```
title: Compressibility detection in btrfs and zstd
date: 2026.09.09 22:07
tags: Linux Btrfs Zstd C
description: An exploration and analysis
```

Based on linux [kernel 7.2.4](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/?h=v7.2.4).

For btrfs + zstd, in fact, there are several measures to "avoid ineffective compression". There's indeed some redundant logic that could be removed, but for now, the results seem acceptable.

From top to bottom:

### Check flags and attrs

In `./fs/btrfs/btrfs_inode.h:474:btrfs_inode_can_compress`, it checks no-cow and no-sum flags of inode, which allow [`chattr +m xxx`](https://manpages.debian.org/trixie/e2fsprogs/chattr.1.en.html#:~:text=compress%20%28m%29) to disable compression for file and dir manually.

```c
// ./fs/btrfs/inode.c:729:inode_need_compress
if (unlikely(!btrfs_inode_can_compress(inode))) {
	DEBUG_WARN("BTRFS: unexpected compression for ino %llu", btrfs_ino(inode));
	return 0;
}
```

Then, other checking logics：

```c
// ... check_inline
// ... defrag_compress
if (end + 1 - start <= fs_info->sectorsize &&
    (!check_inline || (start > 0 || end + 1 < inode->disk_i_size)))
	return 0;
// ... inode->flags & BTRFS_INODE_NOCOMPRESS
```

- Compress if there's [`compress-force`](https://btrfs.readthedocs.io/en/latest/ch-mount-options.html#:~:text=compress%2Dforce%20is%20specified) in mount options.
- Skip for inline inode.
- Skip if already mark as `NOCOMPRESS`.

### Heuristic detection

In the end of `inode_need_compress` function, it calls `./fs/btrfs/compression.c:1560:btrfs_compress_heuristic`.

The specific implementation is complex, so I won't paste code here. In summary, it samples the byte distribution.

- Byte set: count of byte values in buckets.
- Core byte set: how many bytes cover 90% of the sample.

Sampling rules `./fs/btrfs/compression.c:620-643`:

- Sample 16 bytes for every 256 bytes;
- A maximum of approximately 8 KiB is sampled per 128 KiB compression unit.
- Thresholds:
  - `./fs/btrfs/compression.c:1272-1273`: Entropy thresholds `65` / `80`.
  - `./fs/btrfs/compression.c:1423-1424`: Core byte set threshold `64` / `200`.
  - `./fs/btrfs/compression.c:1462`: Byte set threshold `64`.

For high-entropy data like h264 video, common results are: byte sets approaches 256, with large core byte set.

### Fallback after compression

After heuristic detection, `./fs/btrfs/inode.c:947` calls `btrfs_compress_bio()` to compress then compare with origin size, if it is even bigger, mark as `NOCOMPRESS`.

```c
if (total_compressed + blocksize > total_in)
	goto mark_incompressible;
```

### Inside zstd

The [zstd](https://github.com/facebook/zstd) is trimmed and adapted, in `./lib/zstd` of the kernel.

It works like this, for 128 KiB block:

- Run LZ match finder.
- Collect matches and literals.
- Try Huffman/FSE encoding.
- If the result is not good enough, emit a raw/RLE block instead.

So zstd avoids keeping a bad compressed result, unlike btrfs avoids starting work.

At the start of a block (`./lib/zstd/compress/zstd_compress.c:3187`):

```c
if (srcSize < MIN_CBLOCK_SIZE + ZSTD_blockHeaderSize + 1 + 1) {
    ...
    return ZSTDbss_noCompress;
}
```

TODO:

- Fast mode in zstd.
- Literal Huffman compression can be skipped, `./lib/zstd/compress/zstd_compress_literals.c:158`
- If every byte is the same, zstd does not need a real Huffman tree, `./lib/zstd/compress/huf_compress.c:1381`.
- The whole block also has a final “not worth it” check, the same conceptual idea as fallback logic in btrfs.

- https://lore.kernel.org/lkml/20260826122558.2662013-1-usama.arif@linux.dev/
- https://lore.kernel.org/all/20260825220616.3842633-1-usama.arif@linux.dev/

<!--

https://berrylium0078.github.io/2025-05/linux/btrfs/index.html

https://t.me/archlinuxcn_group/3054167

-->
