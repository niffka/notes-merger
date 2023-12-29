export const tplConTitle = `
<grid drag="100 100" drop="0 0" flow="col" align="bottom">
<% source %>
</grid>

<grid drag="90 10" drop="5 40"  align="centre" pad="0 20px">
<% title %>
</grid>

<% content %>

<style>
.horizontal_dotted_line{
border-bottom: 2px dotted gray;
} 
} 
</style>

<grid drag="94 0" drop="3 -8" class="horizontal_dotted_line">
</grid>`;

export const tplConLast = `
<grid drag="100 100" drop="top" >
<% content %>
</grid>

<style>
.horizontal_dotted_line{
  border-bottom: 2px dotted gray;
} 
} 
</style>

<grid drag="94 0" drop="3 -8" class="horizontal_dotted_line">
</grid>`;

export const tplConBasic = `
<grid drag="100 10" drop="top" bg="white" align="left" pad="0 20px">
 <% title %>
</grid>

<grid drag="94 70" drop="3 15" bg="white" style="border-radius:15px"/>

<grid drag="90 66" drop="5 17" align="topleft">
<% content %>
</grid>

<style>
.horizontal_dotted_line{
  border-bottom: 2px dotted gray;
} 
} 
</style>

<grid drag="94 0" drop="3 -6" class="horizontal_dotted_line">
</grid>

<grid drag="100 30" drop="0 64" align="bottomleft" pad="0 30px" >
<%? source %>
</grid>`;

export const tplConImage = `
<grid drag="100 10" drop="top" bg="white" align="left" pad="0 20px">
 <% title %>
</grid>

<grid drag="90 75" drop="5 12"  align="centre">
<% middle %>
</grid>

<grid drag="90 5" drop="5 -6"  align="centre">
<%? source %>
</grid>

<% content %>

<style>
.horizontal_dotted_line{
  border-bottom: 2px dotted gray;
} 
} 
</style>

<grid drag="94 0" drop="3 -6" class="horizontal_dotted_line">
</grid>`;

export const tplConSplit = `
<grid drag="100 10" drop="top" bg="white" align="left" pad="0 20px">
 <% title %>
</grid>

<grid drag="37 75" drop="3 15" bg="white" style="border-radius:15px"/>

<grid drag="35 71" drop="4 17" align="topleft">
<% left %>
</grid>


<grid drag="57 75" drop="41 15" align="centre">
<% right %>
</grid>

<grid drag="54 4" drop="-3 -6"  align="centre">
<%? source %>
</grid>

<% content %>

<style>
.horizontal_dotted_line{
  border-bottom: 2px dotted gray;
} 
} 
</style>

<grid drag="94 0" drop="3 -6" class="horizontal_dotted_line">
</grid>`;
