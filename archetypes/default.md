+++
date = '{{ .Date }}'
draft = true
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
# frozen at creation — keeps the giscus discussion attached if the title or URL changes
commentsId = '{{ replace (replace .File.ContentBaseName "-" " ") "_" " " | title }}'
+++
