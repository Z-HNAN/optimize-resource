optimize-resource

use nodejs to optimize resource with WebUI

- support optimize jpeg/png

## use in local

```bash
npm install

# change index.js DIRECTORY_PATH
npm start
```

use WebUI

[http://localhost:3000/web](http://localhost:3000/web)

## use in docker (Recommend)

```bash
docker run -d -p 3000:3000 -v /photo:/path/your/photo zhnan/optimize-resource
```