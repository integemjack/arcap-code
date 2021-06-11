#video.txt or photo.txt description

## The first link is email's subject

## Content parameter replacement rule
- {name}  -> User's name(first and last)
- {email} -> User's email
- {link}  -> Vimeo's link
- {token} -> User's token
- image0- -> 用户拍摄的照片，为固定参数，根据用户拍摄的照片的数量，从0开始！比如：
```html
<img style="width: 100%;" src="cid:image0" />
<img style="width: 100%;" src="cid:image1" />
<img style="width: 100%;" src="cid:image2" />
<img style="width: 100%;" src="cid:image3" />
```

## Hypertext format supported, like 
```html
<a href="http://integem.com">http://integem.com</a>
```