import { ref, unref, nextTick } from 'vue'
import { FormSchema } from '@/types/form'
import { SearchExpose, SearchProps } from '@/components/Search'

export const useSearch = () => {
  const searchRef = ref<SearchExpose>()

  const register = (ref: SearchExpose) => {
    searchRef.value = ref
  }

  const getSearch = async () => {
    await nextTick()
    const search = unref(searchRef)
    if (!search) {
      console.error('The Search is not registered. Please use the register method to register')
    }
    return search
  }

  const methods = {
    setProps: async (props: SearchProps = {}) => {
      const search = await getSearch()
      search?.setProps(props)
      if (props.model) {
        search?.setValues(props.model)
      }
    },
    setValues: async (data: Recordable) => {
      const search = await getSearch()
      search?.setValues(data)
    },
    setSchema: async (schemaProps: Array<{ field: string; path: string; value: any }>) => {
      const search = await getSearch()
      search?.setSchema(schemaProps)
    },
    addSchema: async (formSchema: FormSchema, index?: number) => {
      const search = await getSearch()
      search?.addSchema(formSchema, index)
    },
    delSchema: async (field: string) => {
      const search = await getSearch()
      search?.delSchema(field)
    },
    getFormData: async <T = Recordable>(): Promise<T> => {
      const search = await getSearch()
      return search?.getFormData() as T
    }
  }

  return {
    searchRegister: register,
    searchMethods: methods
  }
}
