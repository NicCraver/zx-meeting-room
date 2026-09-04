/** E2E 打真实 Java /meetingRoom，contact 必须在 7004。 */
export default async function globalSetup() {
  const url = "http://127.0.0.1:7004/swagger-ui.html";
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    throw new Error(
      `contact Java 未就绪（${url}）：${error.message}。先在 apps/contact 起 jar 再跑 pnpm test:e2e。`
    );
  }
}
