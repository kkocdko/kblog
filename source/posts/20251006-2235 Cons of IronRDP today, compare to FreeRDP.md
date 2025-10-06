```
title: Cons of IronRDP today, compare to FreeRDP
date: 2025.10.06 22:35
tags: RDP Windows Linux
description: In October 2025
```

> In October 2025.

## Usage

First, my min method to run IronRDP. Require a Windows machine running with RDP enabled.

Download <https://github.com/Devolutions/devolutions-gateway> .

```json
{
  "Id": "xxx-xxx-xxx",
  "ProvisionerPublicKeyFile": "provisioner.pem",
  "ProvisionerPrivateKeyFile": "provisioner.key",
  "TlsVerifyStrict": true,
  "Listeners": [
    {
      "InternalUrl": "tcp://*:8181",
      "ExternalUrl": "tcp://*:8181"
    },
    {
      "InternalUrl": "http://*:7171",
      "ExternalUrl": "https://*:7171"
    }
  ],
  "WebApp": {
    "Enabled": true,
    "Authentication": "None",
    "StaticRootPath": "webapp"
  },
  "__debug__": {
    "disable_token_validation": true
  }
}
```

```txt
kkocdko@klp1:/media/kkocdko/KK_TMP_1/ironrdp$ tree
.
├── boot.stacktrace
├── devolutions-gateway
├── gateway.json
├── job_queue.db
├── provisioner.key
├── provisioner.pem
└── webapp
    ├── client
    │   ├── 3rdpartylicenses.txt
    │   ├── assets
    │   └── ...
    └── player
        ├── assets
        ├── index.html
        ├── locales
        └── ...

20 directories, 130 files
kkocdko@klp1:/media/kkocdko/KK_TMP_1/ironrdp$ 
```

## Cons

- Clipboard unusable.

- Poor performance in browser WebGL renderer.

- Due to the lake of implement, it use much more bandwidth compare to FreeRDP.

## Reference

- https://github.com/Devolutions/IronRDP/issues/767

- https://github.com/Devolutions/IronRDP/issues?q=bandwidth
