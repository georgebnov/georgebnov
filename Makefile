.PHONY: update-articles banner

update-articles:
	node generate-rss.js
	@echo "RSS feed generated: articles.xml"

banner:
	node scripts/banner.js
