<script lang="ts" setup>
import { ElForm, FormItemProp } from 'element-plus'
import { PropType, useAttrs, useSlots } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { useForm } from '@/hooks/web/useForm'
import { findIndex } from '@/utils'
import { cloneDeep, set } from 'lodash-es'
import { FormSchema } from '@/types/form'
import { initModel } from '@/components/Form/src/helper'

defineOptions({ name: 'Search', inheritAttrs: false })

const { t } = useI18n()
const attrs = useAttrs()
const slots = useSlots()

const props = defineProps({
  schema: {
    type: Array as PropType<FormSchema[]>,
    default: () => []
  },
  isCol: propTypes.bool.def(false),
  labelWidth: propTypes.oneOfType([String, Number]).def('auto'),
  layout: propTypes.string.validate((v: string) => ['inline', 'bottom'].includes(v)).def('inline'),
  buttonPosition: propTypes.string
    .validate((v: string) => ['left', 'center', 'right'].includes(v))
    .def('center'),
  buttomPosition: propTypes.string
    .validate((v: string) => ['left', 'center', 'right'].includes(v))
    .def('center'),
  showSearch: propTypes.bool.def(true),
  showReset: propTypes.bool.def(true),
  showExpand: propTypes.bool.def(false),
  expand: propTypes.bool.def(false),
  expandField: propTypes.string.def(''),
  inline: propTypes.bool.def(true),
  removeNoValueItem: propTypes.bool.def(true),
  model: {
    type: Object as PropType<Recordable>,
    default: () => ({})
  },
  searchLoading: propTypes.bool.def(false),
  resetLoading: propTypes.bool.def(false)
})

const emit = defineEmits(['search', 'reset', 'register', 'validate'])

const visible = ref(true)
const slotMode = computed(() => props.schema.length === 0 && !!slots.default)

const formModel = ref<Recordable>(props.model)

const mergedButtonPosition = computed(() => props.buttonPosition || props.buttomPosition)

const newSchema = computed(() => {
  let schema: FormSchema[] = cloneDeep(props.schema)
  if ((props.showExpand || props.expand) && props.expandField && !unref(visible)) {
    const index = findIndex(schema, (v: FormSchema) => v.field === props.expandField)
    schema = schema.map((item, currentIndex) => ({
      ...item,
      hidden: index > -1 ? currentIndex >= index : item.hidden
    }))
  }
  if (props.layout === 'inline') {
    schema = schema.concat([
      {
        field: 'action',
        formItemProps: {
          labelWidth: '0px'
        }
      }
    ])
  }
  return schema
})

const { register, elFormRef, methods } = useForm({
  model: props.model || {}
})

const schemaRef = ref<FormSchema[]>([])

watch(
  () => unref(newSchema),
  (schema = []) => {
    formModel.value = initModel(schema, unref(formModel))
    schemaRef.value = schema
  },
  {
    immediate: true,
    deep: true
  }
)

const filterModel = async () => {
  const { getFormData } = methods
  const model = await getFormData()
  if (!props.removeNoValueItem) {
    return model
  }
  return Object.keys(model || {}).reduce((prev, next) => {
    const value = model[next]
    if (value !== '' && value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (Object.keys(value).length > 0) {
          prev[next] = value
        }
      } else {
        prev[next] = value
      }
    }
    return prev
  }, {} as Recordable)
}

const search = async () => {
  if (slotMode.value) {
    emit('search', props.model)
    return
  }
  await unref(elFormRef)?.validate(async (isValid) => {
    if (isValid) {
      const model = await filterModel()
      emit('search', model)
    }
  })
}

const reset = async () => {
  if (slotMode.value) {
    await resetFields()
    emit('reset', props.model)
    return
  }
  unref(elFormRef)?.resetFields()
  const model = await filterModel()
  emit('reset', model)
}

const bottomButtonStyle = computed(() => ({
  textAlign: unref(mergedButtonPosition) as unknown as 'left' | 'center' | 'right'
}))

const setVisible = () => {
  visible.value = !unref(visible)
}

const setProps = async (searchProps: Recordable = {}) => {
  await methods.setProps(searchProps)
}

const setValues = async (data: Recordable) => {
  formModel.value = Object.assign({}, formModel.value, data)
  await methods.setValues(data)
}

const setSchema = async (schemaProps: Array<{ field: string; path: string; value: any }>) => {
  const schema = schemaRef.value.length ? schemaRef.value : props.schema
  for (const field of schema) {
    for (const item of schemaProps) {
      if (field.field === item.field) {
        set(field, item.path, item.value)
      }
    }
  }
  await methods.setSchema(schemaProps as any)
}

const delSchema = async (field: string) => {
  await methods.delSchema(field)
}

const addSchema = async (formSchema: FormSchema, index?: number) => {
  await methods.addSchema(formSchema, index)
}

const getFormData = async <T = Recordable>() => {
  if (slotMode.value) {
    return props.model as T
  }
  return (await filterModel()) as T
}

const resetFields = async () => {
  if (slotMode.value) {
    const elForm = unref(slotElFormRef)
    await elForm?.resetFields()
    return
  }
  unref(elFormRef)?.resetFields()
}

const validate = async (callback?: (isValid: boolean) => void) => {
  const form = slotMode.value ? unref(slotElFormRef) : unref(elFormRef)
  const result = await form?.validate().then(
    () => true,
    () => false
  )
  callback?.(!!result)
  return result
}

const slotElFormRef = ref<ComponentRef<typeof ElForm>>()

const onFormValidate = (prop: FormItemProp, isValid: boolean, message: string) => {
  emit('validate', prop, isValid, message)
}

const defaultExpose = {
  setValues,
  setProps,
  delSchema,
  addSchema,
  setSchema,
  getFormData,
  resetFields,
  validate
}

onMounted(() => {
  emit('register', defaultExpose)
})

defineExpose(defaultExpose)
</script>

<template>
  <div class="search-block-gap">
    <template v-if="slotMode">
      <ElForm
        ref="slotElFormRef"
        class="-mb-15px"
        v-bind="attrs"
        :model="model"
        :inline="inline"
        :label-width="labelWidth"
      >
        <slot></slot>
      </ElForm>
    </template>

    <template v-else>
      <Form
        :inline="inline"
        :is-col="isCol"
        :is-custom="false"
        :label-width="labelWidth"
        :model="formModel"
        :schema="schemaRef"
        class="-mb-15px"
        hide-required-asterisk
        @register="register"
        @validate="onFormValidate"
      >
        <template #action>
          <div v-if="layout === 'inline'">
            <ElButton v-if="showSearch" :loading="searchLoading" @click="search">
              <Icon class="mr-5px" icon="ep:search" />
              {{ t('common.query') }}
            </ElButton>
            <ElButton v-if="showReset" :loading="resetLoading" @click="reset">
              <Icon class="mr-5px" icon="ep:refresh" />
              {{ t('common.reset') }}
            </ElButton>
            <ElButton v-if="showExpand || expand" text @click="setVisible">
              {{ t(visible ? 'common.shrink' : 'common.expand') }}
              <Icon :icon="visible ? 'ep:arrow-up' : 'ep:arrow-down'" />
            </ElButton>
            <slot name="actionMore"></slot>
          </div>
        </template>
        <template v-for="name in Object.keys($slots)" :key="name" #[name]>
          <slot :name="name"></slot>
        </template>
      </Form>
    </template>

    <template v-if="!slotMode && layout === 'bottom'">
      <div :style="bottomButtonStyle">
        <ElButton v-if="showSearch" type="primary" :loading="searchLoading" @click="search">
          <Icon class="mr-5px" icon="ep:search" />
          {{ t('common.query') }}
        </ElButton>
        <ElButton v-if="showReset" :loading="resetLoading" @click="reset">
          <Icon class="mr-5px" icon="ep:refresh" />
          {{ t('common.reset') }}
        </ElButton>
        <ElButton v-if="showExpand || expand" text @click="setVisible">
          {{ t(visible ? 'common.shrink' : 'common.expand') }}
          <Icon :icon="visible ? 'ep:arrow-up' : 'ep:arrow-down'" />
        </ElButton>
        <slot name="actionMore"></slot>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.search-block-gap {
  margin-bottom: 16px;
  padding: 14px 16px 8px;
  border: 1px solid #e9eef5;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
}
</style>
