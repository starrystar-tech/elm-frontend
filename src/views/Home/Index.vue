<template>
    <div class="home-page">
        <section class="home-hero">
            <div class="home-hero__copy">
                <div class="home-hero__eyebrow">Elm Workspace</div>
                <h1 class="home-hero__title">欢迎回来，{{ displayName }}</h1>
                <p class="home-hero__subtitle">
                    首页已经从内部分机测试中收口出来，浏览器分机注册、来电接听和 FreeSWITCH
                    调试统一保留在 CRM 呼叫测试页，后续维护只需要看一处。
                </p>
                <div class="home-hero__actions">
                    <el-button type="primary" size="large" @click="goToCallTest">
                        前往呼叫测试
                    </el-button>
                    <el-button size="large" @click="goToProfile">个人中心</el-button>
                </div>
            </div>
            <div class="home-hero__panel">
                <div class="hero-panel-card">
                    <div class="hero-panel-card__label">当前建议</div>
                    <div class="hero-panel-card__value">浏览器分机能力仅保留在 CRM</div>
                    <div class="hero-panel-card__hint">
                        后续来电提醒、录音回写、签入签出、外呼调试都只维护一份页面逻辑。
                    </div>
                </div>
            </div>
        </section>

        <el-row :gutter="16" class="home-grid">
            <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
                <el-card shadow="never" class="home-card home-card--accent">
                    <template #header>
                        <div class="home-card__header">
                            <span>呼叫测试入口</span>
                        </div>
                    </template>
                    <div class="home-card__body">
                        <div class="home-card__title">CRM / 呼叫测试</div>
                        <p class="home-card__text">
                            浏览器分机注册、来电桌面浮层、内部号拨打、服务器桥接测试都在这里。
                        </p>
                        <el-button type="primary" plain @click="goToCallTest">
                            打开测试页
                        </el-button>
                    </div>
                </el-card>
            </el-col>

            <el-col :xl="8" :lg="8" :md="12" :sm="24" :xs="24">
                <el-card shadow="never" class="home-card">
                    <template #header>
                        <div class="home-card__header">
                            <span>当前账号</span>
                        </div>
                    </template>
                    <div class="profile-list">
                        <div class="profile-item">
                            <span>昵称</span>
                            <strong>{{ displayName }}</strong>
                        </div>
                        <div class="profile-item">
                            <span>登录账号</span>
                            <strong>{{ userStore.getUser.username || '-' }}</strong>
                        </div>
                        <div class="profile-item">
                            <span>手机号</span>
                            <strong>{{ userStore.getUser.mobile || '-' }}</strong>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xl="8" :lg="8" :md="12" :sm="24" :xs="24">
                <el-card shadow="never" class="home-card">
                    <template #header>
                        <div class="home-card__header">
                            <span>维护说明</span>
                        </div>
                    </template>
                    <div class="home-notes">
                        <div class="home-note">首页不再承载内部分机测试逻辑。</div>
                        <div class="home-note">后续 SIP/通知问题只需要排查 CRM 测试页。</div>
                        <div class="home-note">避免 `Home` 和 `call/test` 两份代码继续漂移。</div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'HomeIndex' })

const userStore = useUserStore()
const { push } = useRouter()

const displayName = computed(
    () => userStore.getUser.nickname || userStore.getUser.username || '同学'
)

const goToCallTest = () => {
    push('/call/test')
}

const goToProfile = () => {
    push('/user/profile')
}
</script>

<style scoped>
.home-page {
    padding: 4px 0 24px;
}

.home-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
    gap: 18px;
    margin-bottom: 18px;
}

.home-hero__copy,
.home-hero__panel {
    min-width: 0;
}

.home-hero__copy {
    padding: 30px 32px;
    border-radius: 28px;
    background:
        radial-gradient(circle at top left, rgba(14, 165, 233, 0.2), transparent 32%),
        linear-gradient(135deg, #082f49, #0f766e 58%, #ecfeff 168%);
    color: #f8fafc;
}

.home-hero__eyebrow {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.76;
}

.home-hero__title {
    margin: 14px 0 10px;
    font-size: 36px;
    line-height: 1.08;
    font-weight: 700;
}

.home-hero__subtitle {
    margin: 0;
    max-width: 700px;
    font-size: 15px;
    line-height: 1.8;
    color: rgba(248, 250, 252, 0.86);
}

.home-hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 24px;
}

.home-hero__panel {
    display: flex;
}

.hero-panel-card {
    width: 100%;
    padding: 22px 22px 20px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.98));
    box-shadow:
        0 16px 36px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.hero-panel-card__label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #0f766e;
}

.hero-panel-card__value {
    margin-top: 12px;
    font-size: 24px;
    line-height: 1.35;
    font-weight: 700;
    color: #0f172a;
}

.hero-panel-card__hint {
    margin-top: 12px;
    font-size: 13px;
    line-height: 1.7;
    color: #475569;
}

.home-grid {
    margin-top: 0;
}

.home-card {
    height: 100%;
    border-radius: 22px;
    border: 1px solid #e2e8f0;
}

.home-card--accent {
    background:
        radial-gradient(circle at top right, rgba(56, 189, 248, 0.14), transparent 30%),
        linear-gradient(180deg, #ffffff, #f8fafc);
}

.home-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.home-card__body {
    display: grid;
    gap: 12px;
}

.home-card__title {
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
}

.home-card__text {
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
    color: #475569;
}

.profile-list,
.home-notes {
    display: grid;
    gap: 12px;
}

.profile-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border-radius: 16px;
    background: #f8fafc;
    color: #334155;
}

.profile-item span {
    font-size: 13px;
    color: #64748b;
}

.profile-item strong {
    font-size: 14px;
    color: #0f172a;
    word-break: break-all;
    text-align: right;
}

.home-note {
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    font-size: 14px;
    line-height: 1.7;
    color: #475569;
}

@media (max-width: 1024px) {
    .home-hero {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .home-hero__copy {
        padding: 24px 20px;
    }

    .home-hero__title {
        font-size: 28px;
    }
}
</style>
