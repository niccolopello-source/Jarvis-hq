# Lossless raw evidence

Decompress `.log.gz` with gzip. SHA256 of both original bytes and gzip is recorded in manifest.json. Original logs and full per-revision raw gzip snapshots remain in /workspace/point3-followup157/. Large cross156.json.gz and cross-final.json.gz are retained there, not omitted from the experiment. They are not attached to git to keep the draft diff focused; regenerate them with the committed worker/comparator.
