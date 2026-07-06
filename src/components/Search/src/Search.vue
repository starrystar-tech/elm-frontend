<script lang="ts" setup>
import { ElForm, FormItemProp } from 'element-plus'
import { PropType, useAttrs, useSlots } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { useForm } from '@/hooks/web/useForm'
import { findIndex } from '@/utils'
import { cloneDeep, set } from 'lodash-es'
import { FormSchema } from '@/types/form'
import { initModel } from '@/components/Form/src/helper'
import { normalizeSearchDateRangeParams } from '@/utils/formatTime'

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

const visible = ref(!props.expandField)
const slotMode = computed(() => props.schema.length === 0 && !!slots.default)
const searchBodyRef = ref<HTMLDivElement>()
const searchOverflow = ref(false)
const searchCanExpand = ref(false)
const collapsedMaxHeight = ref(0)

const formModel = ref<Recordable>(props.model)
const preservedModel = ref<Recordable>({ ...(props.model || {}) })
const schemaFieldSignature = ref('')

const mergedButtonPosition = computed(() => props.buttonPosition || props.buttomPosition)
const expandEnabled = computed(() => {
  return (
    props.showExpand ||
    props.expand ||
    !!props.expandField ||
    searchCanExpand.value
  )
})
const fieldExpandEnabled = computed(() => unref(expandEnabled) && !!props.expandField)
const useExternalActionBar = computed(
  () => props.layout === 'inline' && !slotMode.value && searchOverflow.value
)

const newSchema = computed(() => {
  let schema: FormSchema[] = cloneDeep(props.schema).map((item) => {
    if (item.component === 'Select' || item.component === 'SelectV2') {
      return {
        ...item,
        componentProps: {
          filterable: true,
          ...item.componentProps
        }
      }
    }
    return item
  })
  if (unref(fieldExpandEnabled) && !unref(visible)) {
    const index = findIndex(schema, (v: FormSchema) => v.field === props.expandField)
    schema = schema.map((item, currentIndex) => ({
      ...item,
      hidden: index > -1 ? currentIndex >= index : item.hidden
    }))
  }
  if (props.layout === 'inline' && !unref(useExternalActionBar)) {
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

const syncExternalModel = (model: Recordable = {}) => {
  if (!props.model || typeof props.model !== 'object') {
    return
  }
  Object.entries(model).forEach(([key, value]) => {
    props.model[key] = value
  })
}

watch(
  () => unref(newSchema),
  (schema = []) => {
    schemaRef.value = schema
    const nextSignature = schema.map((item) => item.field).join('|')

    if (schemaFieldSignature.value === nextSignature) {
      return
    }

    const externalModel = props.model || {}
    const prevModel = {
      ...unref(preservedModel),
      ...unref(formModel),
      ...externalModel
    }
    const nextModel = initModel(schema, prevModel)
    schema.forEach((item) => {
      if (!item.hidden) {
        return
      }
      if (Object.prototype.hasOwnProperty.call(prevModel, item.field)) {
        nextModel[item.field] = prevModel[item.field]
        return
      }
      if (Object.prototype.hasOwnProperty.call(externalModel, item.field)) {
        nextModel[item.field] = externalModel[item.field]
      }
    })
    Object.keys(prevModel).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(nextModel, key)) {
        nextModel[key] = prevModel[key]
      }
    })
    formModel.value = nextModel
    preservedModel.value = {
      ...unref(preservedModel),
      ...nextModel
    }
    schemaFieldSignature.value = nextSignature
    syncExternalModel(unref(preservedModel))
  },
  {
    immediate: true,
    deep: true
  }
)

watch(
  () => props.model,
  (model) => {
    const nextModel = model || {}
    formModel.value = {
      ...unref(formModel),
      ...nextModel
    }
    preservedModel.value = {
      ...unref(preservedModel),
      ...nextModel
    }
  },
  {
    deep: true
  }
)

watch(
  formModel,
  (model) => {
    preservedModel.value = {
      ...unref(preservedModel),
      ...(model || {})
    }
    syncExternalModel(unref(preservedModel))
  },
  {
    deep: true
  }
)

const filterModel = async () => {
  const { getFormData } = methods
  const model = await getFormData()
  if (!props.removeNoValueItem) {
    return normalizeSearchDateRangeParams(model, schemaRef.value)
  }
  const filteredModel = Object.keys(model || {}).reduce((prev, next) => {
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
  return normalizeSearchDateRangeParams(filteredModel, schemaRef.value)
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

const measureSearchRows = async () => {
  if (slotMode.value || props.layout !== 'inline') return
  await nextTick()

  const formBody = unref(searchBodyRef)
  if (!formBody) return

  let formItems = Array.from(formBody.querySelectorAll('.el-form-item')) as HTMLElement[]
  if (!formItems.length) return

  // Inline schema mode appends an action row at the end; exclude it when measuring whether
  // actual search fields exceed two rows.
  if (!unref(useExternalActionBar) && formItems.length > 1) {
    formItems = formItems.slice(0, -1)
  }

  if (!formItems.length) return

  const topValues: number[] = []
  const containerTop = formBody.getBoundingClientRect().top

  formItems.forEach((item) => {
    const top = Math.round(item.getBoundingClientRect().top - containerTop)
    if (!topValues.includes(top)) {
      topValues.push(top)
    }
  })

  topValues.sort((a, b) => a - b)

  if (topValues.length <= 2) {
    if (unref(useExternalActionBar) && topValues.length === 2) {
      searchOverflow.value = true
      searchCanExpand.value = false
      collapsedMaxHeight.value = 0
      if (!unref(fieldExpandEnabled)) {
        visible.value = true
      }
      return
    }
    searchOverflow.value = false
    searchCanExpand.value = false
    collapsedMaxHeight.value = 0
    if (!unref(fieldExpandEnabled)) {
      visible.value = true
    }
    return
  }

  const secondRowTop = topValues[1]
  const secondRowItems = formItems.filter((item) => {
    const top = Math.round(item.getBoundingClientRect().top - containerTop)
    return top === secondRowTop
  })
  const secondRowBottom = Math.max(
    ...secondRowItems.map((item) => item.getBoundingClientRect().bottom - containerTop)
  )

  collapsedMaxHeight.value = Math.ceil(secondRowBottom + 4)
  searchOverflow.value = true
  searchCanExpand.value = true
  if (!unref(fieldExpandEnabled)) {
    visible.value = false
  }
}

const setProps = async (searchProps: Recordable = {}) => {
  await methods.setProps(searchProps)
}

const setValues = async (data: Recordable) => {
  preservedModel.value = Object.assign({}, unref(preservedModel), data)
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

const getFormData = async <T = Recordable,>() => {
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

const onEnterSearch = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) return
  const tagName = target.tagName?.toUpperCase()
  if (tagName === 'TEXTAREA') return
  event.preventDefault()
  event.stopPropagation()
  search()
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
  measureSearchRows()
  window.addEventListener('resize', measureSearchRows)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureSearchRows)
})

watch(
  () => [schemaRef.value, props.layout, slotMode.value],
  () => {
    measureSearchRows()
  },
  { deep: true }
)

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
        @keydown.enter="onEnterSearch"
      >
        <slot></slot>
      </ElForm>
    </template>

    <template v-else>
      <div
        ref="searchBodyRef"
        :class="{ 'search-body--collapsed': useExternalActionBar && !visible }"
        :style="
          useExternalActionBar && !visible && collapsedMaxHeight
            ? { maxHeight: `${collapsedMaxHeight}px` }
            : undefined
        "
      >
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
          @keydown.enter="onEnterSearch"
        >
          <template #action>
            <div v-if="layout === 'inline'">
              <ElButton v-if="showSearch" type="primary" :loading="searchLoading" @click="search">
                <Icon class="mr-5px" icon="ep:search" />
                {{ t('common.query') }}
              </ElButton>
              <ElButton v-if="showReset" :loading="resetLoading" @click="reset">
                <Icon class="mr-5px" icon="ep:refresh" />
                {{ t('common.reset') }}
              </ElButton>
              <ElButton
                v-if="expandEnabled && !useExternalActionBar"
                text
                @click="setVisible"
              >
                {{ t(visible ? 'common.shrink' : 'common.expand') }}
                <Icon :icon="visible ? 'ep:arrow-up' : 'ep:arrow-down'" />
              </ElButton>
              <slot name="actionMore"></slot>
            </div>
          </template>
          <template v-for="name in Object.keys($slots)" :key="name" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps"></slot>
          </template>
        </Form>
      </div>
    </template>

    <template v-if="useExternalActionBar">
      <div class="search-external-actions">
        <ElButton v-if="showSearch" type="primary" :loading="searchLoading" @click="search">
          <Icon class="mr-5px" icon="ep:search" />
          {{ t('common.query') }}
        </ElButton>
        <ElButton v-if="showReset" :loading="resetLoading" @click="reset">
          <Icon class="mr-5px" icon="ep:refresh" />
          {{ t('common.reset') }}
        </ElButton>
        <ElButton v-if="expandEnabled" text @click="setVisible">
          {{ t(visible ? 'common.shrink' : 'common.expand') }}
          <Icon :icon="visible ? 'ep:arrow-up' : 'ep:arrow-down'" />
        </ElButton>
        <slot name="actionMore"></slot>
      </div>
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
        <ElButton v-if="expandEnabled" text @click="setVisible">
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

.search-body--collapsed {
  overflow: hidden;
}

.search-external-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
  padding-top: 10px;
  padding-right: 4px;
  border-top: 1px solid rgba(15, 23, 42, 0.04);
}
</style>
