import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import chaiProperties from 'chai-properties'
chai.use(chaiProperties)
import sinonChai from 'sinon-chai'
chai.use(sinonChai)

export default chai.expect
