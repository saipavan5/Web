<!DOCTYPE html>
<head>
  <title>Spreadsheet open Page</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>

{{#open}}
<p class="heading">{{heading}}</p>
<form action="/form">
  <p class="spreadsheet-name">{{name}} </p><input type="text" id="ssName" name="ssName" value={{val}}><br>
  <input type="submit" value="open">
  <p id="ssNameError">{{error}}</p>
{{/open}}
</form>

</body>
</html>