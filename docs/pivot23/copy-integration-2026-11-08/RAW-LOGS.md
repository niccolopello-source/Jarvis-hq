# Raw evidence logs

The `.log.gz` files are lossless copies, not whitespace-cleaned transcripts. Decompress with `gzip -dc FILE.log.gz`; the SHA256 of the raw bytes is recorded in manifest.json. Original uncompressed files remain in `/workspace/point3-evidence/`. Compression avoids git whitespace warnings in unmodified Playwright failure output.
