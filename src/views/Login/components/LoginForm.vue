<template>
    <div v-show="getShow" class="login-form-container">
        <!-- 密码登录 -->
        <el-form
            ref="formLogin"
            :model="loginData.loginForm"
            :rules="LoginRules"
            class="login-form"
            label-position="top"
            size="large"
        >
            <el-form-item prop="username" class="form-item-custom">
                <el-input
                    v-model="loginData.loginForm.username"
                    placeholder="请输入用户名"
                    :prefix-icon="iconAvatar"
                    class="input-custom"
                />
            </el-form-item>

            <el-form-item prop="password" class="form-item-custom">
                <el-input
                    v-model="loginData.loginForm.password"
                    placeholder="请输入密码"
                    :prefix-icon="iconLock"
                    show-password
                    type="password"
                    @keyup.enter="getCode()"
                    class="input-custom"
                />
            </el-form-item>

            <div class="flex items-center justify-between mt-4 mb-6">
                <el-checkbox v-model="loginData.loginForm.rememberMe" class="checkbox-custom">
                    记住我
                </el-checkbox>
                <!-- <el-link
          type="primary"
          @click="setLoginState(LoginStateEnum.RESET_PASSWORD)"
          class="link-custom"
        >
          忘记密码
        </el-link> -->
            </div>

            <el-form-item class="form-item-custom">
                <el-button
                    :loading="loginLoading"
                    type="primary"
                    class="w-full button-custom"
                    @click="getCode()"
                >
                    登录
                </el-button>
            </el-form-item>
        </el-form>

        <Verify
            v-if="loginData.captchaEnable === 'true'"
            ref="verify"
            :captchaType="captchaType"
            :imgSize="{ width: '400px', height: '200px' }"
            mode="pop"
            @success="handleLogin"
        />
    </div>
</template>
<script lang="ts" setup>
import { ElLoading } from 'element-plus'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { useIcon } from '@/hooks/web/useIcon'

import * as authUtil from '@/utils/auth'
import { usePermissionStore } from '@/store/modules/permission'
import * as LoginApi from '@/api/login'
import { LoginStateEnum, useFormValid, useLoginState } from './useLogin'

defineOptions({ name: 'LoginForm' })

const { t } = useI18n()
const message = useMessage()
const iconHouse = useIcon({ icon: 'ep:house' })
const iconAvatar = useIcon({ icon: 'ep:avatar' })
const iconLock = useIcon({ icon: 'ep:lock' })
const formLogin = ref()
const { validForm } = useFormValid(formLogin)
const { setLoginState, getLoginState } = useLoginState()
const { currentRoute, push } = useRouter()
const permissionStore = usePermissionStore()
const redirect = ref<string>('')
const loginLoading = ref(false)
const verify = ref()
const captchaType = ref('blockPuzzle') // blockPuzzle 滑块 clickWord 点击文字 pictureWord 文字验证码

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

const LoginRules = {
    tenantName: [required],
    username: [required],
    password: [required]
}
const loginData = reactive({
    isShowPassword: false,
    captchaEnable: import.meta.env.VITE_APP_CAPTCHA_ENABLE,
    tenantEnable: import.meta.env.VITE_APP_TENANT_ENABLE,
    loginForm: {
        tenantName: import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT || '',
        username: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || '',
        password: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || '',
        captchaVerification: '',
        rememberMe: true // 默认记录我。如果不需要，可手动修改
    }
})

// 获取验证码
const getCode = async () => {
    // 情况一，未开启：则直接登录
    if (loginData.captchaEnable === 'false') {
        await handleLogin({})
    } else {
        // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
        // 弹出验证码
        verify.value.show()
    }
}

// 获取租户 ID
const getTenantId = async () => {
    if (loginData.tenantEnable === 'true') {
        const res = await LoginApi.getTenantIdByName(loginData.loginForm.tenantName)
        authUtil.setTenantId(res)
    }
}

// 记住我
const getLoginFormCache = () => {
    const loginForm = authUtil.getLoginForm()
    if (loginForm) {
        loginData.loginForm = {
            ...loginData.loginForm,
            username: loginForm.username ? loginForm.username : loginData.loginForm.username,
            password: loginForm.password ? loginForm.password : loginData.loginForm.password,
            rememberMe: loginForm.rememberMe,
            tenantName: loginForm.tenantName ? loginForm.tenantName : loginData.loginForm.tenantName
        }
    }
}

const loading = ref() // ElLoading.service 返回的实例

// 登录
const handleLogin = async (params: any) => {
    loginLoading.value = true
    try {
        const data = await validForm()
        if (!data) {
            return
        }
        const loginDataLoginForm = { ...loginData.loginForm }
        loginDataLoginForm.captchaVerification = params.captchaVerification
        const res = await LoginApi.login(loginDataLoginForm)
        if (!res) {
            return
        }
        loading.value = ElLoading.service({
            lock: true,
            text: '正在加载系统中...',
            background: 'rgba(0, 0, 0, 0.7)'
        })
        if (loginDataLoginForm.rememberMe) {
            authUtil.setLoginForm(loginDataLoginForm)
        } else {
            authUtil.removeLoginForm()
        }
        authUtil.removeVisitTenantId()
        authUtil.setToken(res)
        if (!redirect.value) {
            redirect.value = '/'
        }
        // 判断是否为SSO登录
        if (redirect.value.indexOf('sso') !== -1) {
            window.location.href = window.location.href.replace('/login?redirect=', '')
        } else {
            await push({ path: redirect.value || permissionStore.addRouters[0].path })
        }
    } finally {
        loginLoading.value = false
        loading.value.close()
    }
}

watch(
    () => currentRoute.value,
    (route: RouteLocationNormalizedLoaded) => {
        redirect.value = route?.query?.redirect as string
    },
    {
        immediate: true
    }
)

onMounted(() => {
    getLoginFormCache()
})
</script>

<style lang="scss" scoped>
.login-form-container {
    width: 100%;
    transition: all 0.3s ease;
}

.form-item-custom {
    margin-bottom: 16px;
}

.input-custom {
    border-radius: 4px;
    transition: all 0.3s ease;
    border: 1px solid #e8e8e8;

    &:focus-within {
        border-color: #409eff;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }

    .el-input__wrapper {
        border-radius: 4px;
        padding: 10px 14px;
    }

    .el-input__prefix {
        margin-right: 8px;
    }
}

.button-custom {
    background: #409eff;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    padding: 25px 12px;
    transition: all 0.3s ease;

    &:hover {
        background: #66b1ff;
    }

    &:active {
        background: #3a8ee6;
    }
}

.checkbox-custom {
    .el-checkbox__inner {
        border-radius: 2px;
        transition: all 0.3s ease;
    }

    .el-checkbox__input.is-checked .el-checkbox__inner {
        background-color: #409eff;
        border-color: #409eff;
    }
}

.link-custom {
    color: #409eff;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
        color: #66b1ff;
        text-decoration: underline;
    }
}

// 深色模式适配
:deep(.dark) {
    .input-custom {
        border-color: #334155;

        &:focus-within {
            border-color: #409eff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }
    }
}
</style>
