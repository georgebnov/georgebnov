.PHONY: update-articles

update-articles:
	node generate-rss.js
	@echo "RSS feed generated: articles.xml"
