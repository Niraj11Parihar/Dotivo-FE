import { NativeModule, requireNativeModule } from 'expo';

declare class TestModule extends NativeModule<{}> {}

export default requireNativeModule<TestModule>('TestModule');
