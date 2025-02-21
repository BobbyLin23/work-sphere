# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install

# 复制源代码
COPY . .

# 构建应用
ENV NEXT_TELEMETRY_DISABLED 1
ARG BETTER_AUTH_URL
ENV AUTH_URL=${BETTER_AUTH_URL}
ENV NEXT_PUBLIC_AUTH_URL=${BETTER_AUTH_URL}
RUN pnpm build

# 生产阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${BETTER_AUTH_URL}

# 添加非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 从构建阶段复制必要文件
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# 仅安装生产依赖
RUN npm install -g pnpm && \
    pnpm install --prod

# 复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 设置正确的权限
RUN chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3016

# 启动应用
CMD ["pnpm", "start"]
