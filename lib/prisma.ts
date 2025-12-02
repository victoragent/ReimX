import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 使用 Prisma 官方推荐的连接方式
const createPrismaClient = () => {
  // 如果在开发环境且没有显式设置 DATABASE_URL（或者它看起来像 Postgres 但我们想用本地 SQLite），
  // 我们可以选择不覆盖 url，让它使用 schema.prisma (或 schema.local.prisma) 中定义的默认值。
  // 但这里的关键问题是 schema.local.prisma 现在硬编码了 "file:./dev.db"。
  // 如果我们在这里覆盖它，就会出错。
  
  const options: any = {
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  };

  // 仅在生产环境或明确指定了非 Postgres URL 时才覆盖
  // 或者更简单：在开发环境下，如果 schema 是本地生成的，我们不要覆盖它
  if (process.env.NODE_ENV === "production") {
    options.datasources = {
      db: {
        url: process.env.DATABASE_URL,
      },
    };
  }

  return new PrismaClient(options);
};

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
