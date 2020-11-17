<!DOCTYPE html>
<head>
  <title>update spreadsheet</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <a id="ss-open" href="/">Open other Spreadsheet</a>
  
  <table class="ss">
	{{#tab}}
	<tr>
	{{#row}}
		{{{col}}}
	{{/row}}
	</tr>
	{{/tab}}
  
  </table>
  
  <p class="error"></p>
    <form action="/ss/hi" method="POST">
      <label for="ssAct">Action</label>
      <span>
	<fieldset>
          <div>
	    <input name="ssAct" type="radio" 
		   id="actClear" value="clear">
	    <label for="actClear">Clear Spreadsheet</label>
          </div>
          <div>
            <input name="ssAct" type="radio"  
		   id="actDelete" value="deleteCell">
	    <label for="act">Delete Cell</label>
          </div>
          <div>
	    <input name="ssAct" type="radio"  
		   id="actUpdate" value="updateCell">
	    <label for="actUpdate">Update Cell</label>
          </div>
        <div>
	  <input name="ssAct" type="radio" 
		 id="actCopy" value="copyCell">
	  <label for="actCopy">Copy Cell</label>
        </div>
	</fieldset>
	<br/>
	<span class="error" id="ssActError">{{ssAct}}</span>
      </span>
      <label for="cellId">Destination Cell ID</label>
      <span>
	<input name="cellId" value="" id="cellId"/>
	<br/>
	<span class="error" id="cellIdError">{{cellId}}</span>
      </span>
      <label for="formula">Formula</label>
      <span>
	<input name="formula" value="" id="formula"/>
	<br/>
	<span class="error" id="formulaError">{{formula}}</span>
      </span>
	<label>&nbsp;</label>
      <input type="submit" value="Update"/>

</body>
</html>
