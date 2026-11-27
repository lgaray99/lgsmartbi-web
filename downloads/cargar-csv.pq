// Función CargarCsv. Carpeta es un parámetro local elegido por quien reproduce.
// Ejemplo de uso en consulta Ventas: ver modelo-powerbi.md.
(Carpeta as text, Archivo as text, Tipos as list) as table =>
let
    Origen = Csv.Document(File.Contents(Carpeta & "/" & Archivo),
        [Delimiter=";", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars=true]),
    Resultado = Table.TransformColumnTypes(Encabezados, Tipos, "en-US")
in
    Resultado
