test: playground.html playground.js cito.js
	$(LOCALAPPDATA)/Programs/Opera/launcher --allow-file-access-from-files file:///$(shell cygpath -am $<)
