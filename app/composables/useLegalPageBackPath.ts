import { computed } from 'vue'
import { resolveFamilyObservationReturnPath } from '../utils/appReturnPath'

export function useLegalPageBackPath() {
  const route = useRoute()

  const backPath = computed(() => resolveFamilyObservationReturnPath(route.query.returnTo))

  return { backPath }
}
