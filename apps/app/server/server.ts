import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import { getServer } from '@app/backend-shared';
import { NAVIGATOR } from '@app/frontend-utils';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import bootstrap from '../src/main.server';
import { Logger } from '@nestjs/common';

// The Express app is exported so that it can be used by serverless Functions.
export async function app() {
  const app = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  app.set('view engine', 'html');
  app.set('views', browserDistFolder);

  // Serve static files from /browser
  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: 'index.html',
    }),
  );

  // setup NestJS app first
  const adapter = new ExpressAdapter(app);

  // redirect all requests to Angular Universal
  app.all(/.*$/, async (req, res, next) => {
    try {
      if (shouldSkip(req.originalUrl)) {
        return next();
      }

      const { protocol, originalUrl, baseUrl, headers } = req;
      const userAgent = headers['user-agent'];

      const html = await commonEngine.render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: baseUrl },
          { provide: 'REQUEST', useValue: req },
          { provide: 'RESPONSE', useValue: res },
          { provide: NAVIGATOR, useValue: userAgent },
        ],
      });

      res.send(html);
    } catch (err) {
      next(err);
    }
  });

  const nestjsApp = await getServer(adapter);
  const configService = nestjsApp.get(ConfigService);
  const port = configService.get<number>('PORT', 5000);
  const logger = new Logger('Server');

  await nestjsApp.init();

  logger.debug(`NestJS app is running on: http://localhost:${port}`);
  await nestjsApp.listen(port);
}

async function run(): Promise<void> {
  await app();
}

function shouldSkip(url: string) {
  return url.startsWith('/api') || url.startsWith('/graphql');
}

run();
