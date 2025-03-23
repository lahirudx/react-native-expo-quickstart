import React from "react";
import { Platform } from "react-native";

// This is a base file that will be overridden by platform-specific versions
export default Platform.select({
  web: () => require("./index.web").default,
  default: () => require("./index.native").default,
})();
