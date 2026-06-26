package expo.modules.testmodule

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TestModule")
  }
}
