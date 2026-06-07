import ClueIntentLevel from './src/ClueIntentLevel.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

export const getClueIntentLevelOptions = () => getIntDictOptions(DICT_TYPE.CRM_CLUE_INTENT_LEVEL)

export default ClueIntentLevel
