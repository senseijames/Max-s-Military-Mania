$(document).ready(function(){
	
var weaponView = document.getElementById('selectedWeapon');
var $actor = $('#actor');
var $spinner = $('#spinner');
var $spinnerImg = $spinner.find('img');
var $spinnerText = $spinner.find('p');

window.addEventListener('keydown', onKeyPress);
$spinner.click(function(e){
  $spinnerImg.toggle();
  $spinnerText.toggle();
});

function onWeaponSelected (event)
{
  var weapon = event.target.value;
  weaponView.innerHTML = 'You chose the: <strong>' + weapon + '</strong>';
}

var MOVE_STEP = 5;

function onKeyPress (event)
{
  console.log($actor.offset());
  var offset = $actor.offset();
  switch (event.keyCode)
  {
    case 37:   // Left
    {
      offset.left -= MOVE_STEP;
      break;
    }
    case 38:   // Up
    {
      offset.top -= MOVE_STEP;
      break;
    }
    case 39:  // Right
      {
        offset.left += MOVE_STEP;
        break;
      }
    case 40: // Down
      {
        offset.top += MOVE_STEP;
        break;
      }
    default:
      return;
  }
  
  $actor.offset(offset);
}
});