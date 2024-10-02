#!/usr/bin/env bash
update_grovepi_firmware(){
	avrdude -c gpio -p m328p -U lfuse:w:0xFF:m -U hfuse:w:0xDA:m -U efuse:w:0x05:m -U flash:w:grove_pi_firmware.hex
}
