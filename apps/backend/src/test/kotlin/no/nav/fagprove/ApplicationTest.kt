package no.nav.fagprove

import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ApplicationTest {
    private fun testApp(block: suspend ApplicationTestBuilder.() -> Unit) =
        testApplication {
            application { module() }
            block()
        }

    private fun ApplicationTestBuilder.jsonClient() =
        createClient {
            install(ContentNegotiation) { json() }
        }

    // ── Root ──────────────────────────────────────────────────────────────

    @Test
    fun `GET - returns 200`() =
        testApp {
            client.get("/").apply {
                assertEquals(HttpStatusCode.OK, status)
            }
        }

    @Test
    fun `GET hello - returns JSON greeting`() =
        testApp {
            val response = client.get("/hello")
            assertEquals(HttpStatusCode.OK, response.status)
            assertTrue(response.contentType()?.match(ContentType.Application.Json) == true)
            assertTrue(response.bodyAsText().contains("\"message\":\"Hello World!\""))
        }

    // ── Cities ────────────────────────────────────────────────────────────

    @Test
    fun `POST cities - creates city and returns id`() =
        testApp {
            val response =
                client.post("/cities") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"Oslo","population":700000}""")
                }
            assertEquals(HttpStatusCode.Created, response.status)
            val id = response.bodyAsText().trim().toIntOrNull()
            assertTrue(id != null && id > 0, "Expected a positive integer ID")
        }

    @Test
    fun `GET cities by id - returns correct city`() =
        testApp {
            val client = jsonClient()
            client.post("/cities") {
                contentType(ContentType.Application.Json)
                setBody("""{"name":"Bergen","population":280000}""")
            }
            val id =
                client
                    .post("/cities") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"name":"Tromsø","population":77000}""")
                    }.bodyAsText()
                    .trim()

            val response = client.get("/cities/$id")
            assertEquals(HttpStatusCode.OK, response.status)
            assertTrue(response.contentType()?.match(ContentType.Application.Json) == true)
            val body = response.bodyAsText()
            assertTrue(body.contains("\"name\":\"Tromsø\""))
            assertTrue(body.contains("\"population\":77000"))
        }

    @Test
    fun `GET cities - returns list`() =
        testApp {
            client.post("/cities") {
                contentType(ContentType.Application.Json)
                setBody("""{"name":"Stavanger","population":145000}""")
            }
            val response = client.get("/cities")
            assertEquals(HttpStatusCode.OK, response.status)
            assertTrue(response.contentType()?.match(ContentType.Application.Json) == true)
            assertTrue(response.bodyAsText().contains("Stavanger"))
        }

    @Test
    fun `GET cities - unknown id returns 404`() =
        testApp {
            assertEquals(HttpStatusCode.NotFound, client.get("/cities/99999").status)
        }

    @Test
    fun `GET cities - non-integer id returns 400`() =
        testApp {
            assertEquals(HttpStatusCode.BadRequest, client.get("/cities/abc").status)
        }

    @Test
    fun `PUT cities - updates city`() =
        testApp {
            val id =
                client
                    .post("/cities") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"name":"OldName","population":1000}""")
                    }.bodyAsText()
                    .trim()

            val updateResponse =
                client.put("/cities/$id") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"NewName","population":2000}""")
                }
            assertEquals(HttpStatusCode.OK, updateResponse.status)

            val body = client.get("/cities/$id").bodyAsText()
            assertTrue(body.contains("\"name\":\"NewName\""))
            assertTrue(body.contains("\"population\":2000"))
        }

    @Test
    fun `DELETE cities - deletes city`() =
        testApp {
            val id =
                client
                    .post("/cities") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"name":"DeleteMe","population":100}""")
                    }.bodyAsText()
                    .trim()

            assertEquals(HttpStatusCode.OK, client.delete("/cities/$id").status)
            assertEquals(HttpStatusCode.NotFound, client.get("/cities/$id").status)
        }

    @Test
    fun `PUT cities - unknown id returns 404`() =
        testApp {
            val response =
                client.put("/cities/99999") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"Ukjent","population":1}""")
                }
            assertEquals(HttpStatusCode.NotFound, response.status)
        }

    @Test
    fun `DELETE cities - unknown id returns 404`() =
        testApp {
            assertEquals(HttpStatusCode.NotFound, client.delete("/cities/99999").status)
        }

    @Test
    fun `POST cities - blank name returns 400`() =
        testApp {
            val response =
                client.post("/cities") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"","population":100}""")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    @Test
    fun `POST cities - negative population returns 400`() =
        testApp {
            val response =
                client.post("/cities") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"Test","population":-1}""")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    @Test
    fun `POST cities - name too long returns 400`() =
        testApp {
            val longName = "a".repeat(256)
            val response =
                client.post("/cities") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"$longName","population":100}""")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    // ── Users ─────────────────────────────────────────────────────────────

    @Test
    fun `POST users - creates user and returns id`() =
        testApp {
            val response =
                client.post("/users") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"Ola Nordmann","age":30}""")
                }
            assertEquals(HttpStatusCode.Created, response.status)
            val id = response.bodyAsText().trim().toIntOrNull()
            assertTrue(id != null && id > 0)
        }

    @Test
    fun `GET users by id - returns correct user`() =
        testApp {
            val id =
                client
                    .post("/users") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"name":"Kari","age":25}""")
                    }.bodyAsText()
                    .trim()

            val response = client.get("/users/$id")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("\"name\":\"Kari\""))
            assertTrue(body.contains("\"age\":25"))
        }

    @Test
    fun `GET users - returns list`() =
        testApp {
            client.post("/users") {
                contentType(ContentType.Application.Json)
                setBody("""{"name":"ListUser","age":40}""")
            }
            val response = client.get("/users")
            assertEquals(HttpStatusCode.OK, response.status)
            assertTrue(response.bodyAsText().contains("ListUser"))
        }

    @Test
    fun `GET users - unknown id returns 404`() =
        testApp {
            assertEquals(HttpStatusCode.NotFound, client.get("/users/99999").status)
        }

    @Test
    fun `PUT users - updates user`() =
        testApp {
            val id =
                client
                    .post("/users") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"name":"Before","age":20}""")
                    }.bodyAsText()
                    .trim()

            client.put("/users/$id") {
                contentType(ContentType.Application.Json)
                setBody("""{"name":"After","age":21}""")
            }

            val body = client.get("/users/$id").bodyAsText()
            assertTrue(body.contains("\"name\":\"After\""))
            assertTrue(body.contains("\"age\":21"))
        }

    @Test
    fun `DELETE users - deletes user`() =
        testApp {
            val id =
                client
                    .post("/users") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"name":"DeleteMe","age":18}""")
                    }.bodyAsText()
                    .trim()

            assertEquals(HttpStatusCode.OK, client.delete("/users/$id").status)
            assertEquals(HttpStatusCode.NotFound, client.get("/users/$id").status)
        }

    @Test
    fun `PUT users - unknown id returns 404`() =
        testApp {
            val response =
                client.put("/users/99999") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"Ukjent","age":1}""")
                }
            assertEquals(HttpStatusCode.NotFound, response.status)
        }

    @Test
    fun `DELETE users - unknown id returns 404`() =
        testApp {
            assertEquals(HttpStatusCode.NotFound, client.delete("/users/99999").status)
        }

    @Test
    fun `POST users - blank name returns 400`() =
        testApp {
            val response =
                client.post("/users") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"","age":30}""")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    @Test
    fun `POST users - negative age returns 400`() =
        testApp {
            val response =
                client.post("/users") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"Test","age":-1}""")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    @Test
    fun `POST users - age over 150 returns 400`() =
        testApp {
            val response =
                client.post("/users") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"Test","age":151}""")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    @Test
    fun `POST users - name too long returns 400`() =
        testApp {
            val longName = "a".repeat(51)
            val response =
                client.post("/users") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"$longName","age":30}""")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    // ── Observability ─────────────────────────────────────────────────────

    @Test
    fun `GET isalive - returns 200`() =
        testApp {
            assertEquals(HttpStatusCode.OK, client.get("/isalive").status)
        }

    @Test
    fun `GET isready - returns 200`() =
        testApp {
            assertEquals(HttpStatusCode.OK, client.get("/isready").status)
        }

    @Test
    fun `GET internal isalive - returns 200`() =
        testApp {
            assertEquals(HttpStatusCode.OK, client.get("/internal/isalive").status)
        }

    @Test
    fun `GET internal isready - returns 200`() =
        testApp {
            assertEquals(HttpStatusCode.OK, client.get("/internal/isready").status)
        }

    @Test
    fun `GET internal metrics - returns Prometheus metrics`() =
        testApp {
            val response = client.get("/internal/metrics")
            assertEquals(HttpStatusCode.OK, response.status)
            assertTrue(response.bodyAsText().contains("ktor_http_server_requests"))
        }

    @Test
    fun `JSON serialization roundtrip for cities`() =
        testApp {
            val client = jsonClient()

            val postResponse =
                client.post("/cities") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"Oslo","population":700000}""")
                }
            assertEquals(HttpStatusCode.Created, postResponse.status)
            val cityId = postResponse.bodyAsText().trim()

            val getResponse = client.get("/cities/$cityId")
            assertEquals(HttpStatusCode.OK, getResponse.status)
            assertTrue(
                getResponse.contentType()?.match(ContentType.Application.Json) == true,
                "Expected application/json content type",
            )
            val body = getResponse.bodyAsText()
            assertTrue(body.contains("\"name\":\"Oslo\""), "Response should contain city name")
            assertTrue(body.contains("\"population\":700000"), "Response should contain population")
        }
}
