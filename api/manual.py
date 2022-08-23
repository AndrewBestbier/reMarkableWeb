from http.server import BaseHTTPRequestHandler
import fitz
import json
import base64
import cgi

class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-type")
        self.end_headers()

        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD': 'POST',
                     'CONTENT_TYPE': self.headers['Content-Type'],
                     })


        file = form["file"]
        file_data = file.file.read()

        doc = fitz.open(None, file_data)

        doc_data = []

        for xref in range(1, doc.xref_length()):
            cont = b""

            if doc.xref_is_stream(xref):
                cont = doc.xref_stream(xref)
            else:
                continue

            yellows = [b"0.996078 0.992157 0.376471 rg", b"0.996078 0.992157 0.376471 RG"]
            is_yellow = [True if y in cont else False for y in yellows]
            ind_yellow = [i for i in range(2) if is_yellow[i] == True]

            if len(ind_yellow) > 0:
                cont = cont.replace(yellows[0], b"1 1 1 RG")
                cont = cont.replace(yellows[1], b"1 1 1 RG")
                doc.update_stream(xref, cont)

        for index, page in enumerate(doc):

            text = page.get_text("text")

            paths = page.get_cdrawings()

            page_annotations = []
            page_images = []

            for path in paths:
                if (path["items"][0][0] == "l" and path.get("closePath") == False):
                    rect = path["rect"]
                    needle = page.get_textbox(rect).replace('\n', ' ').strip()
                    if (needle != ''):
                        page_annotations.append(needle)
                    continue

                if (path["items"][0][0] == "l" and path["color"] == (1.0, 1.0, 1.0)):
                    rect = path["rect"]
                    image = page.get_pixmap(matrix=fitz.Identity, clip=rect, annots=False)
                    page_images.append(base64.b64encode(image.tobytes(output='png')).decode('utf_8'))

            grouped_annotations = []
            next_location = -1
            current_highlight = ""

            for idx, annotation in enumerate(page_annotations):
                location = text.find(annotation)
                length = len(annotation)

                if (idx == 0):
                    current_highlight = annotation
                    next_location = location + length + 1
                    continue

                if (location == next_location):
                    current_highlight = current_highlight + " " + annotation
                    next_location = location + length + 1
                    continue

                if (location != next_location):
                    grouped_annotations.append(current_highlight)
                    current_highlight = annotation
                    next_location = location + length + 1
                    continue

            if (current_highlight != ""):
                grouped_annotations.append(current_highlight)

            doc_data.append({"page": index + 1, "images": page_images, "annotations": grouped_annotations})

        json_string = json.dumps(doc_data)
        self.wfile.write(json_string.encode(encoding='utf_8'))