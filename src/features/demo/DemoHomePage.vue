<template>
  <div class="zx-page min-h-100vh bg-layout-gradient px-16px py-32px">
    <div class="mx-auto" :class="showAdmin ? 'max-w-960px' : 'max-w-720px'">
      <h1 class="m-0 text-22px font-600 leading-32px text-pretty">
        智能会议室
      </h1>
      <p
        class="mt-8px mb-24px text-14px leading-22px text-grayDark text-pretty"
      >
        本机联调 contact Java，用真实 query 进入（zxAccountId / zxCorpId /
        zxClientType）。演示身份 zx-001 / demo-admin 已作废。
      </p>
      <div class="grid gap-16px" :class="showAdmin ? 'md:grid-cols-2' : ''">
        <section>
          <h2 class="m-0 mb-12px text-16px font-500 leading-24px">
            预定会议室
          </h2>
          <button
            type="button"
            class="w-full flex items-center justify-between gap-12px px-12px py-10px rounded-8px border border-edge bg-grayLight text-left cursor-pointer hover:border-primaryBorder hover:bg-primaryLight"
            @click="enterAsJavaUser('booking')"
          >
            <span class="min-w-0">
              <span class="block text-14px leading-20px font-500 truncate">{{
                LOCAL_JAVA_AUTH.label
              }}</span>
              <span class="block text-12px leading-18px text-grayDark truncate"
                >accountId {{ LOCAL_JAVA_AUTH.zxAccountId }} · corp
                {{ LOCAL_JAVA_AUTH.zxCorpId }}</span
              >
            </span>
            <span
              class="shrink-0 text-12px leading-18px px-8px py-2px rounded-4px bg-primaryLight text-primary"
            >
              进入预定
            </span>
          </button>
        </section>
        <section v-if="showAdmin">
          <h2 class="m-0 mb-4px text-16px font-500 leading-24px">会议室管理</h2>
          <p class="m-0 mb-12px text-12px leading-18px text-mute">
            依赖 contact 的 meeting.admin.userIds 白名单
          </p>
          <button
            type="button"
            class="w-full flex items-center justify-between gap-12px px-12px py-10px rounded-8px border border-edge bg-grayLight text-left cursor-pointer hover:border-primaryBorder hover:bg-primaryLight"
            @click="enterAsJavaUser('admin')"
          >
            <span class="min-w-0">
              <span class="block text-14px leading-20px font-500 truncate">{{
                LOCAL_JAVA_AUTH.label
              }}</span>
              <span class="block text-12px leading-18px text-grayDark truncate"
                >进入房间、字典与预定记录</span
              >
            </span>
            <span
              class="shrink-0 text-12px leading-18px px-8px py-2px rounded-4px bg-primaryLight text-primary"
            >
              进入管理
            </span>
          </button>
        </section>
        <section class="md:col-span-2">
          <h2 class="m-0 mb-12px text-16px font-500 leading-24px">
            并发抢订测试
          </h2>
          <button
            type="button"
            class="w-full flex items-center justify-between gap-12px px-12px py-10px rounded-8px border border-edge bg-grayLight text-left cursor-pointer hover:border-primaryBorder hover:bg-primaryLight"
            @click="enterAsJavaUser('race')"
          >
            <span class="min-w-0">
              <span class="block text-14px leading-20px font-500 truncate"
                >两个网页同时订同一时段</span
              >
              <span class="block text-12px leading-18px text-grayDark truncate"
                >看 Java 行锁是拦下第二个，还是双双成功</span
              >
            </span>
            <span
              class="shrink-0 text-12px leading-18px px-8px py-2px rounded-4px bg-primaryLight text-primary"
            >
              进入测试
            </span>
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  LOCAL_JAVA_AUTH,
  currentCanEnterDemoAdmin,
  enterAsJavaUser
} from "./session";

const showAdmin = currentCanEnterDemoAdmin();
</script>
