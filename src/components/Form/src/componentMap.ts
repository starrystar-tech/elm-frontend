import type { Component } from 'vue'
import {
  ElCascader,
  ElCheckboxGroup,
  ElColorPicker,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElRadioGroup,
  ElRate,
  ElSelect,
  ElSelectV2,
  ElTreeSelect,
  ElSlider,
  ElSwitch,
  ElTimePicker,
  ElTimeSelect,
  ElTransfer,
  ElAutocomplete,
  ElDivider
} from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import AmountRangeInput from '@/components/AmountRangeInput.vue'
import { Editor } from '@/components/Editor'
import { UploadImg, UploadImgs, UploadFile } from '@/components/UploadFile'
import AreaSelect from '@/components/AreaSelect.vue'
import ProductTypeSelect from '@/components/ProductTypeSelect.vue'
import DeptSelector from '@/views/system/dept/components/DeptSelector.vue'
import SourceSelect from '@/components/SourceSelect.vue'
import { ComponentName } from '@/types/components'

const componentMap: Recordable<Component, ComponentName> = {
  AmountRangeInput: AmountRangeInput,
  Radio: ElRadioGroup,
  Checkbox: ElCheckboxGroup,
  CheckboxButton: ElCheckboxGroup,
  Input: ElInput,
  Autocomplete: ElAutocomplete,
  InputNumber: ElInputNumber,
  Select: ElSelect,
  Cascader: ElCascader,
  Switch: ElSwitch,
  Slider: ElSlider,
  TimePicker: ElTimePicker,
  DatePicker: ElDatePicker,
  Rate: ElRate,
  ColorPicker: ElColorPicker,
  Transfer: ElTransfer,
  Divider: ElDivider,
  TimeSelect: ElTimeSelect,
  SelectV2: ElSelectV2,
  TreeSelect: ElTreeSelect,
  RadioButton: ElRadioGroup,
  InputPassword: InputPassword,
  Editor: Editor,
  UploadImg: UploadImg,
  UploadImgs: UploadImgs,
  UploadFile: UploadFile,
  AreaSelect: AreaSelect,
  ProductTypeSelect: ProductTypeSelect,
  DeptSelector: DeptSelector,
  SourceSelect: SourceSelect
}

export { componentMap }
