import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('WiFi Hotspot Portal API')
    .setDescription(
      'NestJS backend API for WiFi Captive Portal with Mobile Money payments and session lifecycle',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 8000;
  await app.listen(port);
  console.log(
    `🚀 NestJS WiFi Portal Backend running on http://localhost:${port}`,
  );
  console.log(
    `📚 Swagger OpenAPI documentation at http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
