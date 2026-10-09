"""製品DBのワークブックを取り込み用JSONへ変換する。"""
import argparse
import json
from pathlib import Path
import posixpath
from xml.etree import ElementTree
from zipfile import ZipFile

MAIN = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RELATION = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
SHEETS = ('製品', 'タグマスター', '表示値', '出典', '根拠原文', '資材ページのリンク')


def column_index(reference):
    result = 0
    for letter in reference:
        if letter.isdigit():
            break
        if not 'A' <= letter <= 'Z':
            raise ValueError(f'不正なセル参照です：{reference}')
        result = result * 26 + ord(letter) - ord('A') + 1
    return result - 1


def extract(workbook_path):
    with ZipFile(workbook_path) as archive:
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = [''.join(text.text or '' for text in node.findall(f'{MAIN}t') + node.findall(f'{MAIN}r/{MAIN}t')) for node in ElementTree.fromstring(archive.read('xl/sharedStrings.xml'))]
        relationships = {
            node.attrib['Id']: node.attrib['Target']
            for node in ElementTree.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        }
        sheet_nodes = ElementTree.fromstring(archive.read('xl/workbook.xml')).findall(f'{MAIN}sheets/{MAIN}sheet')
        sheets = {node.attrib['name']: relationships[node.attrib[f'{RELATION}id']] for node in sheet_nodes}
        output = {}
        for name in SHEETS:
            target = sheets[name]
            path = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
            document = ElementTree.fromstring(archive.read(path))
            if document.find(f'{MAIN}mergeCells') is not None:
                raise ValueError(f'{name}に結合セルがあります。表の構造を確認してください。')
            rows = []
            for row in document.findall(f'{MAIN}sheetData/{MAIN}row'):
                cells = {}
                for cell in row:
                    reference = cell.attrib['r']
                    if cell.find(f'{MAIN}f') is not None or cell.attrib.get('t') == 'e':
                        raise ValueError(f'{name}の{reference}に数式またはエラーがあります。確定値を入力してください。')
                    raw = cell.findtext(f'{MAIN}v')
                    kind = cell.attrib.get('t')
                    if kind == 'inlineStr':
                        value = ''.join(cell.find(f'{MAIN}is').itertext())
                    elif raw is None:
                        value = None
                    elif kind == 's':
                        value = strings[int(raw)]
                    elif kind == 'b':
                        value = raw == '1'
                    elif kind == 'str':
                        value = raw
                    else:
                        number = float(raw)
                        value = int(number) if number.is_integer() else number
                    cells[column_index(reference)] = value
                if any(value is not None for value in cells.values()):
                    rows.append(cells)
            if not rows:
                raise ValueError(f'{name}に見出しがありません。')
            headers = [rows[0].get(index) for index in range(max(rows[0]) + 1)]
            if any(not isinstance(header, str) or not header for header in headers) or len(headers) != len(set(headers)):
                raise ValueError(f'{name}の見出しが空欄または重複しています。')
            output[name] = [{header: row.get(index) for index, header in enumerate(headers)} for row in rows[1:]]
        return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    args.output.write_text(json.dumps(extract(args.workbook), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
