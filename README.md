# LINE Bot Development Utilities
This extension contains utilities for LINE bot developers.

- JSON code snippets to create JSON LINE Message object.
- JSON to UI converter: Provide preview pane for JSON LINE Message object.

## JSON code snippets
1. Open any .json file and start typing "text".
1. Select snippet candidate for "LINE Text Message".
1. You see the JSON object for Text Message will be auto generate.<br/>
![snipppet](https://github.com/kenakamu/LINEBotDeveloperUtil/tree/master/readme_images/snippet.gif)

## JSON to UI converter
1. Open any .json file, and select JSON object.
1. Click preview icon on the right top.
1. You see the parsed UI results. You can change the JSON data which update the UI realtime.<br/>
![ui1](https://github.com/kenakamu/LINEBotDeveloperUtil/tree/master/readme_images/ui1.gif)
1. For nested JSON like buttons, you need to explicitly select JSON object from first '{' to last '}'.
![ui2](https://github.com/kenakamu/LINEBotDeveloperUtil/tree/master/readme_images/ui1.gif)

## Supported Snippets.
- Text Message
- Sticker Message (Only Id)
- Image Message
- Video Message
- Audio Message
- Imagemap Message
- Confirm Template message
- Buttons Template message
- Carousel Template message
- Image Carousel Template message

# Desired features
- JSON to Code, such as C#, golang, python, etc.
- Location Message
- Rich Menu
- etc