import { PromiseExecutor } from '@nx/devkit';
import { BuildExecutorSchema } from './schema';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const runExecutor: PromiseExecutor<BuildExecutorSchema> = async (options, context) => {
  const environmentVariables = {
    production: process.env.NODE_ENV === 'production',
    Auth0IssuerUrl: process.env.AUTH0_ISSUER_URL,
    Auth0Audience: process.env.AUTH0_AUDIENCE,
    Auth0ClientId: process.env.AUTH0_CLIENT_ID,
    baseUrl: process.env.BASE_URL,
  }

  // Path to the Angular environment file (e.g., src/environments/environment.ts)
  const envFilePath = join(context.root, 'apps', context.projectName, 'src', 'environments', 'environment.ts');

  // Generate the content for the environment file
  const envFileContent = `
    export const environment = {
      production: ${environmentVariables.production},
      Auth0IssuerUrl: '${environmentVariables.Auth0IssuerUrl}',
      Auth0Audience: '${environmentVariables.Auth0Audience}',
      Auth0ClientId: '${environmentVariables.Auth0ClientId}',
      baseUrl: '${environmentVariables.baseUrl}',
    }
  `;

  // create the environments directory if it doesn't exist
  const envDir = dirname(envFilePath);
  if (!existsSync(envDir)) {
    mkdirSync(envDir, { recursive: true });
  }

  // Write the environment file
  writeFileSync(envFilePath, envFileContent);

  // debug environment file
  console.log('Environment file written:', envFileContent);

  return { success: true }
}

export default runExecutor;
