import ExpoModulesCore

public class ExpoChromaModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoChroma')` in JavaScript.
    Name("ExpoChroma")

    // Defines constant property on the module.
    Constant("PI") {
      Double.pi
    }

    // Defines event names that the module can send to JavaScript.
    Events("onChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("processImage") { (data: RawDirectBuffer) -> Bool in
      processChromaKey(data.pointer.assumingMemoryBound(to: UInt8.self), data.size)
      return true
    }

    AsyncFunction("processImageAsync") { (data: RawDirectBuffer) -> Bool in
      processChromaKey(data.pointer.assumingMemoryBound(to: UInt8.self), data.size)
      return true
    }

    AsyncFunction("processImageBase64") { (base64String: String) -> String in
      guard let data = Data(base64Encoded: base64String),
            let image = UIImage(data: data) else {
        throw Exception(name: "ERR_CHROMA", description: "Falha ao decodificar imagem")
      }

      // Converte para RGBA8888
      guard let cgImage = image.cgImage else {
        throw Exception(name: "ERR_CHROMA", description: "Falha ao obter CGImage")
      }

      let width = cgImage.width
      let height = cgImage.height
      let colorSpace = CGColorSpaceCreateDeviceRGB()
      var rawData = [UInt8](repeating: 0, count: width * height * 4)
      let bytesPerPixel = 4
      let bytesPerRow = bytesPerPixel * width
      let bitsPerComponent = 8
      
      guard let context = CGContext(data: &rawData,
                                    width: width,
                                    height: height,
                                    bitsPerComponent: bitsPerComponent,
                                    bytesPerRow: bytesPerRow,
                                    space: colorSpace,
                                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue) else {
        throw Exception(name: "ERR_CHROMA", description: "Falha ao criar contexto")
      }

      context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

      // Processa via C++ SIMD
      processChromaKey(&rawData, rawData.count)

      // Converte de volta para UIImage -> Base64
      guard let newCGImage = context.makeImage() else {
        throw Exception(name: "ERR_CHROMA", description: "Falha ao criar nova imagem")
      }
      
      let newImage = UIImage(cgImage: newCGImage)
      guard let pngData = newImage.pngData() else {
        throw Exception(name: "ERR_CHROMA", description: "Falha ao converter para PNG")
      }

      return pngData.base64EncodedString()
    }

    Function("hello") {
      return "Hello world! 👋"
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { (value: String) in
      // Send an event to JavaScript.
      self.sendEvent("onChange", [
        "value": value
      ])
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of the
    // view definition: Prop, Events.
    View(ExpoChromaView.self) {
      // Defines a setter for the `url` prop.
      Prop("url") { (view: ExpoChromaView, url: URL) in
        if view.webView.url != url {
          view.webView.load(URLRequest(url: url))
        }
      }

      Events("onLoad")
    }
  }
}
