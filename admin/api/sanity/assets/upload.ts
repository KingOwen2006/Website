import {wrap} from '../../_lib/http'
import {handleUpload} from '../../_lib/handlers'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default wrap(handleUpload)
