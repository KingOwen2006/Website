# KingOwen Website

## 3D Models (secure delivery)

Models are configured in `models-config.json`:

- **downloadable**: `true` = users can download; `false` = no download link
- **encrypted**: `true` = serve `.glb.enc` (XOR-encrypted); `false` = serve plain `.glb`

### Encrypting models

1. Put your `.glb` files in the `Models` folder (or set `modelsDir` in config).
2. Set `encrypted: true` for each model in `models-config.json`.
3. Run: `node scripts/encrypt-models.js`
4. This creates `.glb.enc` files. The viewer fetches these and decrypts them in memory.

**Security note:** The decryption key is in the client. This prevents casual right-click/download and direct URL copying, but a determined user could extract it. For stronger protection, use a server-side proxy.

### Example config

```json
{
  "encryptionKey": "your-secret-key",
  "models": {
    "ship.glb": { "downloadable": false, "encrypted": true },
    "public-model.glb": { "downloadable": true, "encrypted": false }
  }
}
```
