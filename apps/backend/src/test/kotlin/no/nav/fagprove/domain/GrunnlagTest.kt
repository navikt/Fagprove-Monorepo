package no.nav.fagprove.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class GrunnlagTest {
    @Test
    fun `OK should have belop`() {
        val grunnlag: Grunnlag = Grunnlag.OK(belop = Penger(65080))
        assertIs<Grunnlag.OK>(grunnlag)
        assertEquals(Penger(65080), grunnlag.belop)
    }

    @Test
    fun `ManuellVurdering should have grunn`() {
        val grunnlag: Grunnlag = Grunnlag.ManuellVurdering(grunn = "Inntekt under grense")
        assertIs<Grunnlag.ManuellVurdering>(grunnlag)
        assertEquals("Inntekt under grense", grunnlag.grunn)
    }

    @Test
    fun `should be exhaustive in when expression`() {
        val grunnlag: Grunnlag = Grunnlag.OK(belop = Penger(100000))
        val resultat =
            when (grunnlag) {
                is Grunnlag.OK -> "Godkjent: ${grunnlag.belop.kroner} kr"
                is Grunnlag.ManuellVurdering -> "Manuell: ${grunnlag.grunn}"
            }
        assertEquals("Godkjent: 100000 kr", resultat)
    }
}
